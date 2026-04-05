'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Phone, Zap, BatteryMedium, Sun, Cpu, CheckCircle, Receipt } from 'lucide-react';
import { useForm } from 'react-hook-form';
// import { usePaystackPayment } from 'react-paystack';

interface Appliance {
  id: number;
  name: string;
  watts: number;
  quantity: number;
  hours: number;
}

// --- PAYSTACK CONFIGURATION ---
const PAYSTACK_PUBLIC_KEY = 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY'; 

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function NairaSolar() {
  const [batteryType, setBatteryType] = useState<'Lithium' | 'Tubular' | 'UsedTubular'>('Lithium');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const phoneInput = watch("phone");

  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: 1, name: 'LED Bulb', watts: 15, quantity: 5, hours: 6 },
    { id: 2, name: 'Standing Fan', watts: 60, quantity: 2, hours: 24 },
    { id: 3, name: 'LED TV', watts: 50, quantity: 1, hours: 6 },
    { id: 4, name: 'Laptop', watts: 65, quantity: 1, hours: 24 },
    { id: 5, name: 'Blender', watts: 400, quantity: 0, hours: 0.2 },
    { id: 6, name: 'Microwave', watts: 1000, quantity: 0, hours: 0.2 },
    { id: 7, name: 'Medium Fridge', watts: 150, quantity: 0, hours: 12 },
  ]);

  const updateQuantity = (id: number, delta: number) => {
    setAppliances(appliances.map(app => 
      app.id === id ? { ...app, quantity: Math.max(0, app.quantity + delta) } : app
    ));
  };

  // Math Engine
  const totalDailyEnergyKwh = appliances.reduce((sum, app) => sum + (app.watts * app.quantity * app.hours), 0) / 1000;
  const peakLoadKw = appliances.reduce((sum, app) => sum + (app.watts * app.quantity), 0) / 1000;
  
  const reqSolarKw = (totalDailyEnergyKwh / 4.5) * 1.2;
  const reqInverterKva = peakLoadKw * 1.5;
  
  // Both New and Used Tubular use 50% Depth of Discharge
  const reqBatteryKwh = batteryType === 'Lithium' ? totalDailyEnergyKwh / 0.8 : totalDailyEnergyKwh / 0.5;

  // Pricing Engine
  const costSolar = reqSolarKw * 400000;
  const costInverter = reqInverterKva * 150000;
  
  // Tiered Battery Pricing
  let costBattery = 0;
  if (batteryType === 'Lithium') {
    costBattery = reqBatteryKwh * 400000;
  } else if (batteryType === 'Tubular') {
    costBattery = reqBatteryKwh * 250000; // New Tubular Rate
  } else {
    costBattery = reqBatteryKwh * 180000; // Used Tubular Rate
  }

  const costCables = 100000;
  const totalCost = costSolar + costInverter + costBattery + costCables;

  const chartData = appliances.filter(app => app.quantity > 0).map(app => ({
    name: app.name,
    value: Number(((app.watts * app.quantity * app.hours) / 1000).toFixed(2))
  }));

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  const getBatteryLabel = () => {
    if (batteryType === 'Lithium') return 'Lithium-Ion';
    if (batteryType === 'Tubular') return 'New Tubular';
    return 'Used Tubular';
  };

  // Paystack Integration
  const config = {
    reference: (new Date()).getTime().toString(),
    email: "customer@nairasolar.com",
    amount: 3000 * 100, 
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      custom_fields: [{ display_name: "Phone Number", variable_name: "phone", value: phoneInput }]
    }
  };

  // const initializePayment = usePaystackPayment(config);

  const onSubmitLead = async (data: any) => {
    try {
      // 1. Save the lead to Firebase Firestore
      const docRef = await addDoc(collection(db, "leads"), {
        phone: data.phone,
        batteryType: batteryType,
        dailyLoadKwh: totalDailyEnergyKwh,
        totalEstimatedCost: totalCost,
        paymentStatus: "PENDING", // You can update this to PAID later if Paystack succeeds
        createdAt: serverTimestamp(),
      });
      
      console.log("Lead successfully saved with ID: ", docRef.id);

      // 2. Open Paystack to collect the ₦3,000 fee
      initializePayment({
          onSuccess: (reference) => {
            setPaymentSuccess(true);
            // Pro-tip: Here is where you would ideally write another function 
            // to update the Firebase document from PENDING to PAID.
          },
          onClose: () => alert("Payment window closed. The installer will not be notified until payment is complete.")
      });

    } catch (error) {
      console.error("Error saving lead: ", error);
      alert("Failed to connect. Please check your internet and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 selection:bg-blue-200">
      
      {/* Mature Header Section */}
      <div className="bg-slate-900 text-white pt-16 pb-24 border-b border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle Solar Pattern Background Element */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">NairaSolar</h1>
          <p className="text-slate-400 text-lg max-w-2xl">Stop guessing. Get a mathematically accurate solar load analysis and connect with verified, professional installers in your city.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-8 -mt-12 relative z-10">
        
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={<Zap size={20}/>} title="Daily Load" value={`${totalDailyEnergyKwh.toFixed(1)} kWh`} color="text-blue-600" />
          <MetricCard icon={<Sun size={20}/>} title="Solar Needed" value={`${reqSolarKw.toFixed(1)} kW`} color="text-yellow-500" />
          <MetricCard icon={<Cpu size={20}/>} title="Inverter" value={`${reqInverterKva.toFixed(1)} kVA`} color="text-purple-600" />
          <MetricCard icon={<BatteryMedium size={20}/>} title="Battery" value={`${reqBatteryKwh.toFixed(1)} kWh`} color="text-green-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Calculator Inputs */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col mb-6 border-b border-slate-100 pb-4 space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Appliance Audit</h2>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Battery Technology</label>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none w-full cursor-pointer"
                  value={batteryType} 
                  onChange={(e) => setBatteryType(e.target.value as 'Lithium' | 'Tubular' | 'UsedTubular')}
                >
                  <option value="Lithium">Lithium-Ion (Smart - 80% DoD)</option>
                  <option value="Tubular">New Tubular Lead-Acid (50% DoD)</option>
                  <option value="UsedTubular">Used Tubular Lead-Acid (50% DoD)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {appliances.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800">{app.name}</p>
                    <p className="text-xs text-slate-500">{app.watts}W • {app.hours}h/day</p>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 rounded-md border border-slate-100 p-1">
                    <button onClick={() => updateQuantity(app.id, -1)} className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:shadow-sm font-bold transition">-</button>
                    <span className="w-6 text-center font-bold text-slate-800">{app.quantity}</span>
                    <button onClick={() => updateQuantity(app.id, 1)} className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:shadow-sm font-bold transition">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Charts & Checkout */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-4 text-slate-800">Energy Breakdown</h2>
              <div className="h-[220px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} kWh`, 'Daily Energy']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                      <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 font-medium">Add appliances to visualize</div>
                )}
              </div>
            </div>

            {/* Mature Invoice Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center space-x-2">
                <Receipt className="text-slate-500" size={20} />
                <h3 className="font-bold text-slate-800 text-lg">System Hardware Quote</h3>
              </div>
              
              <div className="p-6 space-y-3">
                <InvoiceRow title={`Solar Panels (${reqSolarKw.toFixed(1)} kW)`} amount={costSolar} formatNaira={formatNaira} />
                <InvoiceRow title={`Inverter Unit (${reqInverterKva.toFixed(1)} kVA)`} amount={costInverter} formatNaira={formatNaira} />
                <InvoiceRow title={`${getBatteryLabel()} Bank (${reqBatteryKwh.toFixed(1)} kWh)`} amount={costBattery} formatNaira={formatNaira} />
                <InvoiceRow title="Installation Cables & Accessories" amount={costCables} formatNaira={formatNaira} />
                
                <div className="pt-4 mt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Estimated Hardware Total</span>
                  <span className="text-2xl font-extrabold text-slate-900">{formatNaira(totalCost)}</span>
                </div>
              </div>

              {/* Lead Gen Footer */}
              <div className="bg-blue-50 border-t border-blue-100 p-6">
                {paymentSuccess ? (
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle className="text-green-600 mb-2" size={32} />
                    <h4 className="text-lg font-bold text-green-700">Payment Verified</h4>
                    <p className="text-slate-600 text-sm mt-1">A verified engineer has received your load profile and will call {phoneInput} shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmitLead)} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" 
                        placeholder="WhatsApp Phone Number" 
                        className={`w-full bg-white border ${errors.phone ? 'border-red-500' : 'border-slate-300'} rounded-md py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                        {...register("phone", { 
                          required: "Required", 
                          pattern: { value: /^[0-9]{10,15}$/, message: "Invalid number" } 
                        })}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all shadow-sm whitespace-nowrap"
                    >
                      Connect Installer (₦3,000)
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className={`flex items-center space-x-2 ${color} mb-2`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function InvoiceRow({ title, amount, formatNaira }: { title: string, amount: number, formatNaira: (a: number) => string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-600 font-medium">{title}</span>
      <span className="text-slate-800 font-bold">{formatNaira(amount)}</span>
    </div>
  );
}