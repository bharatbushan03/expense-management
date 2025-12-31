import React, { useEffect, useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from '../components/ui/Card';
import { generateFinancialInsights } from '../services/geminiService';
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

const Insights: React.FC = () => {
  const { transactions } = useTransactions();
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (transactions.length === 0) return;
      setLoading(true);
      const result = await generateFinancialInsights(transactions);
      try {
        setInsights(JSON.parse(result));
      } catch (e) {
        setInsights(["Could not generate insights at this moment."]);
      }
      setLoading(false);
    };

    fetchInsights();
  }, [transactions]); // Re-run when transactions change

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3">
         <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
           <Sparkles className="w-6 h-6" />
         </div>
         <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Financial Advisor</h2>
          <p className="text-gray-500">Smart insights powered by Gemini 3 Flash.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-indigo-600 font-medium">Analyzing your spending habits...</p>
              </div>
            ) : insights.length > 0 ? (
               <div className="space-y-4">
                 {insights.map((insight, idx) => (
                   <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-50">
                     <div className="mt-1 bg-indigo-100 p-2 rounded-lg text-indigo-600">
                       <Lightbulb className="w-5 h-5" />
                     </div>
                     <div>
                       <h4 className="font-semibold text-gray-900 mb-1">Insight #{idx + 1}</h4>
                       <p className="text-gray-600 leading-relaxed">{insight}</p>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                Not enough data to generate insights. Add some transactions!
              </div>
            )}
          </div>
        </Card>
        
        {/* Placeholder cards for future roadmap features */}
        <Card title="Predicted Spending" className="opacity-75">
          <div className="flex items-center justify-center h-32 text-gray-400 flex-col">
            <TrendingUp className="w-8 h-8 mb-2" />
            <p>Coming Soon</p>
          </div>
        </Card>

        <Card title="Risk Analysis" className="opacity-75">
           <div className="flex items-center justify-center h-32 text-gray-400 flex-col">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p>Coming Soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
