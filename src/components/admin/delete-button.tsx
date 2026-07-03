type DeleteButtonProps = {
  action: () => Promise<void>;
  label: string;
};

export function DeleteButton({ action, label }: DeleteButtonProps) {
  return (
    <form action={action}>
      <button type="submit" className="danger-button">
        {label}
      </button>
    </form>
  );
}
