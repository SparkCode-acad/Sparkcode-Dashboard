import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { jsPDF } from "jspdf";

interface Transaction {
    id: string;
    description: string;
    amount: string;
    date: string;
    type: "income" | "expense";
    status: string;
}

const Finance = () => {
    const [financeData, setFinanceData] = useState({
        balance: "$0.00",
        income: "$0.00",
        expenses: "$0.00",
        transactions: [] as Transaction[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(doc(db, "finance", "overview"),
            (docSnap) => {
                if (docSnap.exists()) {
                    setFinanceData(docSnap.data() as any);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Failed to fetch finance data", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text("Financial Statement", 20, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);

        // Stats
        doc.setFontSize(14);
        doc.text("Overview", 20, 45);
        doc.setFontSize(10);
        doc.text(`Total Balance: ${financeData.balance}`, 20, 55);
        doc.text(`Monthly Income: ${financeData.income}`, 20, 60);
        doc.text(`Monthly Expenses: ${financeData.expenses}`, 20, 65);

        // Transactions Table
        doc.setFontSize(14);
        doc.text("Recent Transactions", 20, 80);

        let y = 90;
        doc.setFontSize(9);
        doc.text("Description", 20, y);
        doc.text("Date", 100, y);
        doc.text("Amount", 140, y);
        doc.text("Status", 170, y);

        doc.line(20, y + 2, 190, y + 2);
        y += 10;

        financeData.transactions.forEach((tx) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(tx.description.substring(0, 40), 20, y);
            doc.text(tx.date, 100, y);
            doc.text(tx.amount, 140, y);
            doc.text(tx.status, 170, y);
            y += 8;
        });

        doc.save(`sparkcode_finance_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleDownloadCSV = () => {
        if (!financeData.transactions.length) {
            alert("No transactions to download.");
            return;
        }

        const headers = ["ID", "Description", "Amount", "Date", "Type", "Status"];
        const csvContent = [
            headers.join(","),
            ...financeData.transactions.map(t =>
                [t.id, `"${t.description}"`, `"${t.amount}"`, t.date, t.type, t.status].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white">Finance & Payroll</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium font-bold uppercase tracking-widest text-[10px]">Manage cashflow and transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadCSV} className="text-xs">
                        CSV
                    </Button>
                    <Button onClick={handleDownloadPDF}>
                        <Download size={18} className="mr-2" /> PDF Report
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center font-bold text-gray-400 py-10">Loading Financial Data...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-black text-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-gray-700">
                                <CardTitle className="text-sm font-bold uppercase text-gray-400">Total Balance</CardTitle>
                                <DollarSign size={20} className="text-spark-yellow" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-spark-yellow">{financeData.balance}</div>
                                <p className="text-xs text-gray-400 mt-1">Available Funds</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-black">
                                <CardTitle className="text-sm font-bold uppercase">Income (Month)</CardTitle>
                                <TrendingUp size={20} className="text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{financeData.income}</div>
                                <p className="text-xs font-bold opacity-70">+12% vs last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-black">
                                <CardTitle className="text-sm font-bold uppercase">Expenses (Month)</CardTitle>
                                <TrendingDown size={20} className="text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-500">{financeData.expenses}</div>
                                <p className="text-xs font-bold opacity-70">Server & Freelancers</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="border-b-black">
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} /> Recent Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b-2 border-black">
                                        <tr>
                                            <th className="p-4 font-bold border-r border-black">Description</th>
                                            <th className="p-4 font-bold border-r border-black">Date</th>
                                            <th className="p-4 font-bold border-r border-black">Amount</th>
                                            <th className="p-4 font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financeData.transactions.map((tx) => (
                                            <tr key={tx.id} className="border-b border-black last:border-0 hover:bg-gray-50">
                                                <td className="p-4 font-bold border-r border-black">{tx.description}</td>
                                                <td className="p-4 border-r border-black text-sm">{tx.date}</td>
                                                <td className={`p-4 font-mono font-bold border-r border-black ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {tx.amount}
                                                </td>
                                                <td className="p-4 font-bold text-sm">
                                                    <span className="bg-gray-200 px-2 py-1 border border-black rounded shadow-neo-sm">
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default Finance;
