interface Props {
  total: number;
}

export default function TotalBar({ total }: Props) {
  return (
    <div className="flex justify-between font-medium border-t mt-2 pt-2 text-sm">
      <span>Total</span>
      <span>${total.toFixed(2)}</span>
    </div>
  );
}
