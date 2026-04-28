import { useEffect, useMemo, useState } from 'react';
import type { AppUser } from '../context/AuthContext';
import type { Attachment, EmailDraft, EmailMessageRecord, EmailSignature } from '../types';
import { ArrowLeft, Check, Mail, Paperclip, PenSquare, Plus, Save, Send, Signature, Trash2, Users } from 'lucide-react';
import { Button } from '../components/common/Button';
import { connectOutlook, disconnectOutlook, getStoredOutlookSession, isOutlookConfigured, saveDraftToOutlook, sendOutlookEmail, type OutlookSession } from '../utils/outlookEmailService';

interface VendorEmailPageProps {
    currentUser: AppUser;
    users: AppUser[];
    drafts: EmailDraft[];
    signatures: EmailSignature[];
    messages: EmailMessageRecord[];
    onBack: () => void;
    onSaveDrafts: (drafts: EmailDraft[]) => void;
    onSaveSignatures: (signatures: EmailSignature[]) => void;
    onSaveMessages: (messages: EmailMessageRecord[]) => void;
}

interface ComposerState {
    id: string | null;
    name: string;
    subject: string;
    body: string;
    toVendorEmails: string[];
    ccInput: string;
    bccInput: string;
    signatureId: string;
    attachments: Attachment[];
    outlookDraftId?: string;
}

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toHtmlParagraphs(text: string) {
    return escapeHtml(text).replace(/\n/g, '<br />');
}

function parseAddressList(value: string) {
    return value.split(/[;,]/).map(part => part.trim()).filter(Boolean);
}

function createEmptyComposer(defaultSignatureId = ''): ComposerState {
    return {
        id: null,
        name: `Draft ${new Date().toLocaleString()}`,
        subject: '',
        body: '',
        toVendorEmails: [],
        ccInput: '',
        bccInput: '',
        signatureId: defaultSignatureId,
        attachments: []
    };
}

function readFileAsAttachment(file: File): Promise<Attachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            resolve({
                id: `email-att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                base64Data: result.includes(',') ? result.split(',')[1] : result
            });
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsDataURL(file);
    });
}

export default function VendorEmailPage({
    currentUser,
    users,
    drafts,
    signatures,
    messages,
    onBack,
    onSaveDrafts,
    onSaveSignatures,
    onSaveMessages
}: VendorEmailPageProps) {
    const vendorUsers = useMemo(
        () => users.filter(user => user.role === 'vendor').sort((a, b) => a.displayName.localeCompare(b.displayName)),
        [users]
    );
    const signatureOptions = useMemo(
        () => signatures.filter(signature => signature.ownerEmail === currentUser.email).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.updatedAt.localeCompare(a.updatedAt)),
        [currentUser.email, signatures]
    );
    const draftOptions = useMemo(
        () => drafts.filter(draft => draft.createdBy === currentUser.email).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        [currentUser.email, drafts]
    );
    const messageHistory = useMemo(
        () => messages.filter(message => message.createdBy === currentUser.email).sort((a, b) => (b.sentAt || b.createdAt).localeCompare(a.sentAt || a.createdAt)),
        [currentUser.email, messages]
    );

    const defaultSignature = signatureOptions.find(signature => signature.isDefault) || signatureOptions[0];
    const [composer, setComposer] = useState<ComposerState>(() => createEmptyComposer(defaultSignature?.id || ''));
    const [signatureName, setSignatureName] = useState('');
    const [signatureContent, setSignatureContent] = useState('');
    const [editingSignatureId, setEditingSignatureId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [outlookSession, setOutlookSession] = useState<OutlookSession | null>(() => getStoredOutlookSession());

    useEffect(() => {
        if (signatureOptions.length > 0) return;

        const now = new Date().toISOString();
        onSaveSignatures([
            ...signatures,
            {
                id: `sig-${Date.now()}`,
                name: 'Default Signature',
                content: `Regards,\n${currentUser.displayName}\nOceanWharf Marine Procurement`,
                isDefault: true,
                ownerEmail: currentUser.email,
                createdAt: now,
                updatedAt: now
            }
        ]);
    }, [currentUser.displayName, currentUser.email, onSaveSignatures, signatureOptions.length, signatures]);

    useEffect(() => {
        setComposer(prev => prev.signatureId ? prev : { ...prev, signatureId: defaultSignature?.id || '' });
    }, [defaultSignature?.id]);

    const selectedSignature = signatureOptions.find(signature => signature.id === composer.signatureId);
    const composedHtml = `${toHtmlParagraphs(composer.body)}${selectedSignature ? `<br /><br />${toHtmlParagraphs(selectedSignature.content)}` : ''}`;

    const loadDraft = (draft: EmailDraft) => {
        setComposer({
            id: draft.id,
            name: draft.name,
            subject: draft.subject,
            body: draft.body,
            toVendorEmails: draft.toVendorEmails,
            ccInput: draft.cc.join(', '),
            bccInput: draft.bcc.join(', '),
            signatureId: draft.signatureId || defaultSignature?.id || '',
            attachments: draft.attachments || [],
            outlookDraftId: draft.outlookDraftId
        });
        setStatusMessage(`Loaded draft "${draft.name}".`);
        setErrorMessage('');
    };

    const resetComposer = () => {
        setComposer(createEmptyComposer(defaultSignature?.id || ''));
        setStatusMessage('Started a new draft.');
        setErrorMessage('');
    };

    const toggleVendor = (email: string) => {
        setComposer(prev => ({
            ...prev,
            toVendorEmails: prev.toVendorEmails.includes(email)
                ? prev.toVendorEmails.filter(item => item !== email)
                : [...prev.toVendorEmails, email]
        }));
    };

    const saveSignature = () => {
        if (!signatureName.trim() || !signatureContent.trim()) {
            setErrorMessage('Signature name and content are required.');
            setStatusMessage('');
            return;
        }

        const existing = editingSignatureId
            ? signatures.find(signature => signature.id === editingSignatureId)
            : undefined;
        const now = new Date().toISOString();
        const nextSignature: EmailSignature = {
            id: editingSignatureId || `sig-${Date.now()}`,
            name: signatureName.trim(),
            content: signatureContent.trim(),
            isDefault: existing?.isDefault || signatureOptions.length === 0,
            ownerEmail: currentUser.email,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };

        onSaveSignatures([...signatures.filter(signature => signature.id !== nextSignature.id), nextSignature]);
        setComposer(prev => ({ ...prev, signatureId: nextSignature.id }));
        setSignatureName('');
        setSignatureContent('');
        setEditingSignatureId(null);
        setStatusMessage(`Signature "${nextSignature.name}" saved.`);
        setErrorMessage('');
    };

    const setDefaultSignature = (signatureId: string) => {
        onSaveSignatures(
            signatures.map(signature => signature.ownerEmail !== currentUser.email
                ? signature
                : { ...signature, isDefault: signature.id === signatureId, updatedAt: new Date().toISOString() })
        );
        setComposer(prev => ({ ...prev, signatureId }));
        setStatusMessage('Default signature updated.');
        setErrorMessage('');
    };

    const deleteSignature = (signatureId: string) => {
        if (!window.confirm('Delete this signature?')) return;
        onSaveSignatures(signatures.filter(signature => signature.id !== signatureId));
        if (composer.signatureId === signatureId) {
            setComposer(prev => ({ ...prev, signatureId: '' }));
        }
        setStatusMessage('Signature deleted.');
        setErrorMessage('');
    };

    const connectMailbox = async () => {
        try {
            setIsBusy(true);
            const session = await connectOutlook();
            setOutlookSession(session);
            setStatusMessage(`Connected to Outlook as ${session.email || session.displayName || 'your account'}.`);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to connect Outlook.');
            setStatusMessage('');
        } finally {
            setIsBusy(false);
        }
    };

    const disconnectMailbox = () => {
        disconnectOutlook();
        setOutlookSession(null);
        setStatusMessage('Outlook connection removed from this browser.');
        setErrorMessage('');
    };

    const ensureValidComposer = () => {
        if (composer.toVendorEmails.length === 0) {
            throw new Error('Select at least one vendor recipient.');
        }
        if (!composer.subject.trim()) {
            throw new Error('Enter an email subject.');
        }
        if (!composer.body.trim()) {
            throw new Error('Enter an email message.');
        }
    };

    const buildDraftRecord = (status: EmailDraft['status'], provider: EmailDraft['provider'], outlookDraftId?: string, lastError?: string): EmailDraft => {
        const timestamp = new Date().toISOString();
        return {
            id: composer.id || `draft-${Date.now()}`,
            name: composer.name.trim() || `Draft ${new Date().toLocaleString()}`,
            subject: composer.subject.trim(),
            body: composer.body,
            toVendorEmails: composer.toVendorEmails,
            cc: parseAddressList(composer.ccInput),
            bcc: parseAddressList(composer.bccInput),
            signatureId: composer.signatureId || undefined,
            attachments: composer.attachments,
            outlookDraftId,
            status,
            provider,
            createdBy: currentUser.email,
            createdAt: composer.id ? drafts.find(draft => draft.id === composer.id)?.createdAt || timestamp : timestamp,
            updatedAt: timestamp,
            lastSyncedAt: provider === 'outlook-graph' ? timestamp : undefined,
            lastSentAt: status === 'sent' ? timestamp : undefined,
            lastError
        };
    };

    const persistDraft = async () => {
        ensureValidComposer();

        let outlookDraftId = composer.outlookDraftId;
        let provider: EmailDraft['provider'] = 'local';

        if (outlookSession) {
            const outlookDraft = await saveDraftToOutlook({
                subject: composer.subject.trim(),
                bodyHtml: composedHtml,
                to: composer.toVendorEmails,
                cc: parseAddressList(composer.ccInput),
                bcc: parseAddressList(composer.bccInput),
                attachments: composer.attachments
            }, composer.outlookDraftId);
            outlookDraftId = outlookDraft.draftId;
            provider = 'outlook-graph';
        }

        const nextDraft = buildDraftRecord('draft', provider, outlookDraftId);
        onSaveDrafts([nextDraft, ...drafts.filter(draft => draft.id !== nextDraft.id)]);
        setComposer(prev => ({ ...prev, id: nextDraft.id, name: nextDraft.name, outlookDraftId: nextDraft.outlookDraftId }));
        setStatusMessage(provider === 'outlook-graph' ? 'Draft saved locally and in Outlook Drafts.' : 'Draft saved locally.');
        setErrorMessage('');
    };

    const sendMessage = async () => {
        ensureValidComposer();
        if (!outlookSession) {
            throw new Error('Connect Outlook before sending mail.');
        }

        await sendOutlookEmail({
            subject: composer.subject.trim(),
            bodyHtml: composedHtml,
            to: composer.toVendorEmails,
            cc: parseAddressList(composer.ccInput),
            bcc: parseAddressList(composer.bccInput),
            attachments: composer.attachments
        });

        const sentDraft = buildDraftRecord('sent', 'outlook-graph', composer.outlookDraftId);
        onSaveDrafts([sentDraft, ...drafts.filter(draft => draft.id !== sentDraft.id)]);
        onSaveMessages([
            {
                id: `msg-${Date.now()}`,
                draftId: sentDraft.id,
                subject: sentDraft.subject,
                body: sentDraft.body,
                toVendorEmails: sentDraft.toVendorEmails,
                cc: sentDraft.cc,
                bcc: sentDraft.bcc,
                signatureId: sentDraft.signatureId,
                attachments: sentDraft.attachments,
                status: 'sent',
                provider: 'outlook-graph',
                createdBy: currentUser.email,
                createdAt: new Date().toISOString(),
                sentAt: new Date().toISOString()
            },
            ...messages
        ]);
        setStatusMessage('Email sent successfully through Outlook.');
        setErrorMessage('');
    };

    const deleteDraft = (draftId: string) => {
        if (!window.confirm('Delete this saved draft from the app?')) return;
        onSaveDrafts(drafts.filter(draft => draft.id !== draftId));
        if (composer.id === draftId) {
            resetComposer();
        }
    };

    const handleAttachmentUpload = async (files: FileList | null) => {
        if (!files?.length) return;

        try {
            setIsBusy(true);
            const loaded = await Promise.all(Array.from(files).map(readFileAsAttachment));
            setComposer(prev => ({ ...prev, attachments: [...prev.attachments, ...loaded] }));
            setStatusMessage(`${loaded.length} attachment${loaded.length === 1 ? '' : 's'} added.`);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to attach file.');
            setStatusMessage('');
        } finally {
            setIsBusy(false);
        }
    };

    const runAsyncAction = async (action: () => Promise<void>) => {
        try {
            setIsBusy(true);
            await action();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'The email action failed.');
            setStatusMessage('');
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="email-page">
            <div className="email-header">
                <div>
                    <div className="email-header-actions">
                        <Button variant="secondary" onClick={onBack}>
                            <ArrowLeft size={15} style={{ marginRight: 6 }} />
                            Back
                        </Button>
                        <span className="email-header-badge">
                            <Mail size={14} />
                            Outlook Vendor Mail
                        </span>
                    </div>
                    <h2>Vendor Email Composer</h2>
                    <p>Compose, save drafts, attach files, manage signatures, and send to selected vendors from your Outlook mailbox.</p>
                </div>
                <div className="email-connection-card">
                    <div className="email-connection-title">Outlook connection</div>
                    <div className={`email-connection-state ${outlookSession ? 'connected' : 'disconnected'}`}>
                        {outlookSession ? `Connected: ${outlookSession.email || outlookSession.displayName || 'Outlook account'}` : 'Not connected'}
                    </div>
                    <div className="email-connection-actions">
                        <Button variant="primary" onClick={connectMailbox} disabled={isBusy || !isOutlookConfigured()}>
                            Connect Outlook
                        </Button>
                        <Button variant="secondary" onClick={disconnectMailbox} disabled={isBusy || !outlookSession}>
                            Disconnect
                        </Button>
                    </div>
                    {!isOutlookConfigured() && (
                        <div className="email-config-note">Set `VITE_OUTLOOK_CLIENT_ID` to enable live Outlook sending.</div>
                    )}
                </div>
            </div>

            {(statusMessage || errorMessage) && (
                <div className={`email-feedback ${errorMessage ? 'error' : 'success'}`}>
                    {errorMessage || statusMessage}
                </div>
            )}

            <div className="email-layout">
                <aside className="email-sidebar">
                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><Users size={15} /> Recipients</span>
                            <div className="email-inline-actions">
                                <button type="button" onClick={() => setComposer(prev => ({ ...prev, toVendorEmails: vendorUsers.map(vendor => vendor.email) }))}>Select all</button>
                                <button type="button" onClick={() => setComposer(prev => ({ ...prev, toVendorEmails: [] }))}>Clear</button>
                            </div>
                        </div>
                        <div className="email-vendor-list">
                            {vendorUsers.map(vendor => (
                                <label key={vendor.id} className="email-vendor-row">
                                    <input type="checkbox" checked={composer.toVendorEmails.includes(vendor.email)} onChange={() => toggleVendor(vendor.email)} />
                                    <div>
                                        <div className="email-vendor-name">{vendor.displayName}</div>
                                        <div className="email-vendor-email">{vendor.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><Save size={15} /> Drafts</span>
                            <button type="button" onClick={resetComposer}>New</button>
                        </div>
                        <div className="email-sidebar-list">
                            {draftOptions.length === 0 && <div className="email-empty-note">No saved drafts yet.</div>}
                            {draftOptions.map(draft => (
                                <div key={draft.id} className="email-sidebar-item">
                                    <button type="button" className="email-sidebar-main" onClick={() => loadDraft(draft)}>
                                        <strong>{draft.subject || draft.name}</strong>
                                        <span>{draft.toVendorEmails.length} vendor{draft.toVendorEmails.length === 1 ? '' : 's'} · {draft.status}</span>
                                    </button>
                                    <button type="button" className="email-icon-button" onClick={() => deleteDraft(draft.id)} title="Delete draft">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><Signature size={15} /> Signatures</span>
                        </div>
                        <div className="email-signature-editor">
                            <input className="form-input" value={signatureName} onChange={event => setSignatureName(event.target.value)} placeholder="Signature name" />
                            <textarea
                                className="form-textarea"
                                value={signatureContent}
                                onChange={event => setSignatureContent(event.target.value)}
                                placeholder={`Regards,\n${currentUser.displayName}`}
                                rows={5}
                            />
                            <div className="email-signature-actions">
                                <Button variant="secondary" onClick={saveSignature}>
                                    {editingSignatureId ? 'Update Signature' : 'Save Signature'}
                                </Button>
                                {editingSignatureId && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setEditingSignatureId(null);
                                            setSignatureName('');
                                            setSignatureContent('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                            <div className="email-sidebar-list">
                                {signatureOptions.map(signature => (
                                    <div key={signature.id} className="email-sidebar-item">
                                        <button
                                            type="button"
                                            className="email-sidebar-main"
                                            onClick={() => {
                                                setEditingSignatureId(signature.id);
                                                setSignatureName(signature.name);
                                                setSignatureContent(signature.content);
                                                setComposer(prev => ({ ...prev, signatureId: signature.id }));
                                            }}
                                        >
                                            <strong>{signature.name}</strong>
                                            <span>{signature.isDefault ? 'Default signature' : 'Click to edit'}</span>
                                        </button>
                                        <div className="email-inline-icon-actions">
                                            <button type="button" className="email-icon-button" onClick={() => setDefaultSignature(signature.id)} title="Set default">
                                                <Check size={14} />
                                            </button>
                                            <button type="button" className="email-icon-button" onClick={() => deleteSignature(signature.id)} title="Delete signature">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="email-main">
                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><PenSquare size={15} /> Compose</span>
                            <div className="email-inline-actions">
                                <button type="button" onClick={() => setComposer(prev => ({ ...prev, name: `${prev.subject || 'Draft'} ${new Date().toLocaleTimeString()}` }))}>Rename draft</button>
                            </div>
                        </div>
                        <div className="email-compose-grid">
                            <div className="email-field-group">
                                <label>Draft name</label>
                                <input className="form-input" value={composer.name} onChange={event => setComposer(prev => ({ ...prev, name: event.target.value }))} />
                            </div>
                            <div className="email-field-group">
                                <label>Subject</label>
                                <input className="form-input" value={composer.subject} onChange={event => setComposer(prev => ({ ...prev, subject: event.target.value }))} placeholder="Enter email subject" />
                            </div>
                            <div className="email-field-group">
                                <label>CC</label>
                                <input className="form-input" value={composer.ccInput} onChange={event => setComposer(prev => ({ ...prev, ccInput: event.target.value }))} placeholder="comma separated emails" />
                            </div>
                            <div className="email-field-group">
                                <label>BCC</label>
                                <input className="form-input" value={composer.bccInput} onChange={event => setComposer(prev => ({ ...prev, bccInput: event.target.value }))} placeholder="comma separated emails" />
                            </div>
                            <div className="email-field-group email-field-full">
                                <label>Signature</label>
                                <select className="form-select" value={composer.signatureId} onChange={event => setComposer(prev => ({ ...prev, signatureId: event.target.value }))}>
                                    <option value="">No signature</option>
                                    {signatureOptions.map(signature => (
                                        <option key={signature.id} value={signature.id}>{signature.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="email-field-group email-field-full">
                                <label>Message</label>
                                <textarea className="form-textarea" rows={12} value={composer.body} onChange={event => setComposer(prev => ({ ...prev, body: event.target.value }))} placeholder="Write your email here" />
                            </div>
                        </div>

                        <div className="email-attachments-bar">
                            <label className="email-upload-button">
                                <Paperclip size={15} />
                                Add Attachments
                                <input type="file" multiple onChange={event => void handleAttachmentUpload(event.target.files)} />
                            </label>
                            <div className="email-attachment-list">
                                {composer.attachments.length === 0 && <span className="email-empty-note">No attachments added.</span>}
                                {composer.attachments.map(file => (
                                    <div key={file.id} className="email-attachment-chip">
                                        <span>{file.fileName}</span>
                                        <button type="button" onClick={() => setComposer(prev => ({ ...prev, attachments: prev.attachments.filter(item => item.id !== file.id) }))}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="email-action-bar">
                            <Button variant="secondary" onClick={() => void runAsyncAction(persistDraft)} disabled={isBusy}>
                                <Save size={15} style={{ marginRight: 6 }} />
                                Save Draft
                            </Button>
                            <Button variant="primary" onClick={() => void runAsyncAction(sendMessage)} disabled={isBusy || !outlookSession}>
                                <Send size={15} style={{ marginRight: 6 }} />
                                Send via Outlook
                            </Button>
                            <Button variant="secondary" onClick={resetComposer} disabled={isBusy}>
                                <Plus size={15} style={{ marginRight: 6 }} />
                                New Message
                            </Button>
                        </div>
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span>Preview</span>
                        </div>
                        <div className="email-preview-meta">
                            <div><strong>To:</strong> {composer.toVendorEmails.join(', ') || 'No vendors selected'}</div>
                            <div><strong>CC:</strong> {parseAddressList(composer.ccInput).join(', ') || '-'}</div>
                            <div><strong>BCC:</strong> {parseAddressList(composer.bccInput).join(', ') || '-'}</div>
                            <div><strong>Attachments:</strong> {composer.attachments.length}</div>
                        </div>
                        <div className="email-preview-body" dangerouslySetInnerHTML={{ __html: composedHtml || '<em>No content yet.</em>' }} />
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span>Recent Activity</span>
                        </div>
                        <div className="email-history-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>When</th>
                                        <th>Subject</th>
                                        <th>Recipients</th>
                                        <th>Status</th>
                                        <th>Provider</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messageHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center">No email activity yet.</td>
                                        </tr>
                                    )}
                                    {messageHistory.map(message => (
                                        <tr key={message.id}>
                                            <td>{new Date(message.sentAt || message.createdAt).toLocaleString()}</td>
                                            <td>{message.subject || '(No subject)'}</td>
                                            <td>{message.toVendorEmails.join(', ')}</td>
                                            <td>{message.status}</td>
                                            <td>{message.provider}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
