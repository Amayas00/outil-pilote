import Modal from './Modal'
import Button from './Button'
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel='Confirmer', danger=false, loading=false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>Annuler</Button><Button variant={danger?'danger':'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button></>}>
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  )
}
