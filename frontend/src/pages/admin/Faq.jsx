import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminFaq() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/faqs');
            setFaqs(res.data);
        } catch (err) {
            setAlert({ type: 'error', msg: 'Erro ao carregar FAQs: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openModal = (faq = null) => {
        setEditingFaq(faq || { question: '', answer: '', sort_order: 0, active: true });
        setModalOpen(true);
    };

    const closeModal = () => {
        setEditingFaq(null);
        setModalOpen(false);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editingFaq.id) {
                await api.put(`/admin/faqs/${editingFaq.id}`, editingFaq);
                setAlert({ type: 'success', msg: 'FAQ atualizado com sucesso.' });
            } else {
                await api.post('/admin/faqs', editingFaq);
                setAlert({ type: 'success', msg: 'FAQ criado com sucesso.' });
            }
            closeModal();
            load();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Erro ao salvar FAQ: ' + err.message });
        }
    };

    const remove = async (id, question) => {
        if (!window.confirm(`Tem certeza que deseja excluir a pergunta "${question}"?`)) return;
        try {
            await api.delete(`/admin/faqs/${id}`);
            setAlert({ type: 'success', msg: 'FAQ excluído.' });
            load();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Erro ao excluir FAQ: ' + err.message });
        }
    };

    const toggleActive = async (faq) => {
        try {
            await api.put(`/admin/faqs/${faq.id}`, { ...faq, active: !faq.active });
            setAlert({ type: 'success', msg: `FAQ ${!faq.active ? 'ativado' : 'desativado'}.` });
            load();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Erro ao alterar status: ' + err.message });
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Perguntas Frequentes (FAQ)</h1>
                    <p>Gerencie as dúvidas que aparecem na página inicial (Home)</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                    <span className="material-icons-round">add</span> Novo FAQ
                </button>
            </div>

            {alert && (
                <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }} onClick={() => setAlert(null)}>
                    <span className="material-icons-round">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
                    {alert.msg}
                </div>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>Ordem</th>
                            <th>Pergunta</th>
                            <th>Status</th>
                            <th style={{ width: 140 }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                        ) : faqs.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum FAQ cadastrado ainda.</td></tr>
                        ) : faqs.map(f => (
                            <tr key={f.id}>
                                <td style={{ textAlign: 'center' }}>{f.sort_order}</td>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{f.question}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.answer.length > 80 ? f.answer.substring(0, 80) + '...' : f.answer}</div>
                                </td>
                                <td>
                                    <span className={`badge ${f.active ? 'badge-active' : 'badge-inactive'}`}>
                                        {f.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => openModal(f)}>
                                            <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                                        </button>
                                        <button className="btn btn-ghost btn-sm" title={f.active ? 'Desativar' : 'Ativar'} onClick={() => toggleActive(f)}>
                                            <span className="material-icons-round" style={{ fontSize: 16, color: f.active ? 'var(--warning)' : 'var(--success)' }}>
                                                {f.active ? 'pause_circle' : 'play_circle'}
                                            </span>
                                        </button>
                                        <button className="btn btn-ghost btn-sm" title="Excluir" onClick={() => remove(f.id, f.question)}>
                                            <span className="material-icons-round" style={{ fontSize: 16, color: 'var(--danger)' }}>delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Editar/Criar FAQ */}
            {modalOpen && editingFaq && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{editingFaq.id ? 'Editar FAQ' : 'Novo FAQ'}</h3>
                            <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={closeModal}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="faqForm" onSubmit={save} className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Pergunta <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input required className="form-input" placeholder="Ex: Como faço para..." value={editingFaq.question} onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Resposta <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <textarea required className="form-textarea" placeholder="Ex: Você pode fazer assim..." value={editingFaq.answer} onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })} rows={4} />
                                </div>
                                <div className="form-grid cols-2">
                                    <div className="form-group">
                                        <label className="form-label">Ordem de Exibição</label>
                                        <input type="number" className="form-input" value={editingFaq.sort_order} onChange={e => setEditingFaq({ ...editingFaq, sort_order: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="form-group" style={{ justifyContent: 'center' }}>
                                        <label className="toggle-switch" style={{ marginTop: 24 }}>
                                            <input type="checkbox" checked={editingFaq.active} onChange={e => setEditingFaq({ ...editingFaq, active: e.target.checked })} />
                                            <div className="toggle-track"><div className="toggle-thumb" /></div>
                                            <span className="toggle-label">{editingFaq.active ? 'Ativo' : 'Inativo'}</span>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                            <button type="submit" form="faqForm" className="btn btn-primary">Salvar FAQ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
