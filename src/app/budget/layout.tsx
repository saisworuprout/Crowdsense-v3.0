import { BudgetProvider } from '@/components/providers/BudgetProvider';

export default function BudgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BudgetProvider>{children}</BudgetProvider>;
}
