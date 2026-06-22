import { notFound } from "next/navigation";
import { getTransaction } from "@/lib/transactions/data";
import { listCategories } from "@/lib/categories/data";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { isApiError } from "@/lib/api/errors";
import type { Transaction } from "@/lib/api/types";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let transaction: Transaction;
  try {
    transaction = await getTransaction(id);
  } catch (error) {
    if (isApiError(error) && error.is("TRANSACTION_NOT_FOUND")) notFound();
    throw error;
  }

  // Inclui arquivadas para preservar a categoria atual no seletor (RN-Tx-3).
  const categories = await listCategories({ includeArchived: true });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar transação</h1>
      <TransactionForm categories={categories} transaction={transaction} />
    </div>
  );
}
