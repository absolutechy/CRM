import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  title?: string
  description: string
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Delete record",
  description,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          className="bg-error text-primary-foreground hover:bg-error-strong"
          onClick={onConfirm}
          loading={isLoading}
        >
          Delete
        </Button>
      </div>
    </div>
  </Modal>
)

export default ConfirmDeleteModal
