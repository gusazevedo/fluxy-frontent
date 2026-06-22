import { listCategories } from "@/lib/categories/data";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default async function NewTransactionPage() {
  // Só categorias ativas no seletor de criação (RN-Cat-4 / RN-Tx-3).
  const categories = await listCategories();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nova transação</h1>
      <TransactionForm categories={categories} />
    </div>
  );
}
