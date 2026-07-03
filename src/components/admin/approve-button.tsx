type ApproveButtonProps = {
  action: () => Promise<void>;
  disabled?: boolean;
};

export function ApproveButton({ action, disabled = false }: ApproveButtonProps) {
  return (
    <form action={action}>
      <button type="submit" className="secondary-button" disabled={disabled}>
        {disabled ? "已审批通过" : "审批通过"}
      </button>
    </form>
  );
}
