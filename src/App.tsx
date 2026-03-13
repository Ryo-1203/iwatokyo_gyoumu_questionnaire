import React, { useState } from 'react';
import { SurveyData, AgeGroup, Gender, LicenseType, RecruitGender } from './types';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

const initialDrivers = (): SurveyData['drivers'] => {
  const ages: AgeGroup[] = ['a10', 'a20', 'a30', 'a40', 'a50', 'a60'];
  const genders: Gender[] = ['male', 'female'];
  const licenses: LicenseType[] = ['ordinary', 'limited5t', 'semiMedium', 'limited8t', 'medium', 'large', 'towing'];

  const drivers: any = {};
  ages.forEach(age => {
    drivers[age] = {};
    genders.forEach(gender => {
      drivers[age][gender] = {};
      licenses.forEach(l => {
        drivers[age][gender][l] = '';
      });
    });
  });
  return drivers;
};

const initialRecruitment = (): SurveyData['recruitment'] => {
  const genders: RecruitGender[] = ['male', 'female', 'any'];
  const licenses: LicenseType[] = ['ordinary', 'limited5t', 'semiMedium', 'limited8t', 'medium', 'large', 'towing'];
  
  const rec: any = {};
  genders.forEach(gender => {
    rec[gender] = {};
    licenses.forEach(l => {
      rec[gender][l] = '';
    });
  });
  return rec;
};

export default function App() {
  const [data, setData] = useState<SurveyData>({
    company: { name: '', phone: '', respondent: '' },
    vehicles: {
      under3_5t: '', under5t: '', under7_5t: '', under8t: '', under11t: '', over11t: '', towed: ''
    },
    drivers: initialDrivers(),
    recruitment: initialRecruitment()
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const updateCompany = (field: keyof SurveyData['company'], value: string) => {
    setData(prev => ({ ...prev, company: { ...prev.company, [field]: value } }));
  };

  const updateVehicle = (field: keyof SurveyData['vehicles'], value: string) => {
    const num = value === '' ? '' : parseInt(value, 10);
    if (value !== '' && isNaN(num as number)) return;
    setData(prev => ({ ...prev, vehicles: { ...prev.vehicles, [field]: num } }));
  };

  const updateDriver = (age: AgeGroup, gender: Gender, license: LicenseType, value: string) => {
    const num = value === '' ? '' : parseInt(value, 10);
    if (value !== '' && isNaN(num as number)) return;
    setData(prev => ({
      ...prev,
      drivers: {
        ...prev.drivers,
        [age]: {
          ...prev.drivers[age],
          [gender]: {
            ...prev.drivers[age][gender],
            [license]: num
          }
        }
      }
    }));
  };

  const updateRecruitment = (gender: RecruitGender, license: LicenseType, value: string) => {
    const num = value === '' ? '' : parseInt(value, 10);
    if (value !== '' && isNaN(num as number)) return;
    setData(prev => ({
      ...prev,
      recruitment: {
        ...prev.recruitment,
        [gender]: {
          ...prev.recruitment[gender],
          [license]: num
        }
      }
    }));
  };

  const sum = (values: (number | '')[]) => values.reduce((a: number, b) => a + (b === '' ? 0 : b), 0);

  const vehicleTotal = sum([
    data.vehicles.under3_5t, data.vehicles.under5t, data.vehicles.under7_5t,
    data.vehicles.under8t, data.vehicles.under11t, data.vehicles.over11t, data.vehicles.towed
  ]);

  const getDriverRowTotal = (age: AgeGroup, gender: Gender) => {
    const row = data.drivers[age][gender];
    // Exclude towing from horizontal total as per instructions (it's a sub-count)
    return sum([row.ordinary, row.limited5t, row.semiMedium, row.limited8t, row.medium, row.large]);
  };

  const getRecruitRowTotal = (gender: RecruitGender) => {
    const row = data.recruitment[gender];
    return sum([row.ordinary, row.limited5t, row.semiMedium, row.limited8t, row.medium, row.large]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const gasUrl = import.meta.env.VITE_GAS_URL;
      
      if (gasUrl) {
        // Submit to Google Apps Script (GitHub Pages compatible)
        // Using text/plain avoids CORS preflight requests
        const res = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Submission failed');
      } else {
        // Fallback to local Express server
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Submission failed');
      }
      
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const ageLabels: Record<AgeGroup, string> = {
    a10: '10代', a20: '20代', a30: '30代', a40: '40代', a50: '50代', a60: '60代以降'
  };
  const genderLabels: Record<Gender, string> = { male: '男性', female: '女性' };
  const recruitGenderLabels: Record<RecruitGender, string> = { male: '男性', female: '女性', any: '男女不問' };
  
  const licenseHeaders = [
    { key: 'ordinary', label: '普通', sub: '(3.5t未満)' },
    { key: 'limited5t', label: '5t限定', sub: '(5t未満)' },
    { key: 'semiMedium', label: '準中型', sub: '(7.5t未満)' },
    { key: 'limited8t', label: '8t限定', sub: '(8t未満)' },
    { key: 'medium', label: '中型', sub: '(11t未満)' },
    { key: 'large', label: '大型', sub: '(11t以上)' },
    { key: 'towing', label: '(内けん引)', sub: '' }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-8 sm:px-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
            運転者の動向調査アンケート
          </h1>
          <p className="mt-2 text-indigo-100 text-center text-sm sm:text-base">
            (公社) 岩手県トラック協会 業務部 宛 (令和6年1月31日時点)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-10 space-y-12">
          
          {/* Section 1: Company Info */}
          <section>
            <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-6">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">会社名</label>
                <input required type="text" value={data.company.name} onChange={e => updateCompany('name', e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">電話番号</label>
                <input required type="tel" value={data.company.phone} onChange={e => updateCompany('phone', e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ご記入者</label>
                <input required type="text" value={data.company.respondent} onChange={e => updateCompany('respondent', e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
              </div>
            </div>
          </section>

          {/* Section 2: Vehicles */}
          <section>
            <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-6">
              【令和6年1月31日時点の保有車両数についてご記入下さい。】
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              注) 県内に複数の営業所がある場合は、県内の営業所全て含めた数を記入して下さい。(県外は除外)
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-center">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">車両総重量</th>
                    <th className="px-3 py-3 font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">3.5t未満</th>
                    <th className="px-3 py-3 font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">3.5t〜5t未満</th>
                    <th className="px-3 py-3 font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">5t〜7.5t未満</th>
                    <th className="px-3 py-3 font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">7.5t〜8t未満</th>
                    <th className="px-3 py-3 font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">8t〜11t未満</th>
                    <th className="px-3 py-3 font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">11t以上</th>
                    <th className="px-3 py-3 font-medium text-slate-600 border-r border-slate-200 whitespace-nowrap">被けん引</th>
                    <th className="px-3 py-3 font-bold text-slate-800 whitespace-nowrap bg-slate-100">(計)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr>
                    <td className="px-3 py-4 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap bg-slate-50">保有車両数</td>
                    <td className="px-2 py-2 border-r border-slate-200"><input type="number" min="0" value={data.vehicles.under3_5t} onChange={e => updateVehicle('under3_5t', e.target.value)} className="w-16 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" /></td>
                    <td className="px-2 py-2 border-r border-slate-200"><input type="number" min="0" value={data.vehicles.under5t} onChange={e => updateVehicle('under5t', e.target.value)} className="w-16 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" /></td>
                    <td className="px-2 py-2 border-r border-slate-200"><input type="number" min="0" value={data.vehicles.under7_5t} onChange={e => updateVehicle('under7_5t', e.target.value)} className="w-16 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" /></td>
                    <td className="px-2 py-2 border-r border-slate-200"><input type="number" min="0" value={data.vehicles.under8t} onChange={e => updateVehicle('under8t', e.target.value)} className="w-16 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" /></td>
                    <td className="px-2 py-2 border-r border-slate-200"><input type="number" min="0" value={data.vehicles.under11t} onChange={e => updateVehicle('under11t', e.target.value)} className="w-16 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" /></td>
                    <td className="px-2 py-2 border-r border-slate-200"><input type="number" min="0" value={data.vehicles.over11t} onChange={e => updateVehicle('over11t', e.target.value)} className="w-16 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" /></td>
                    <td className="px-2 py-2 border-r border-slate-200"><input type="number" min="0" value={data.vehicles.towed} onChange={e => updateVehicle('towed', e.target.value)} className="w-16 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" /></td>
                    <td className="px-3 py-4 font-bold text-slate-800 bg-slate-50">{vehicleTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Drivers */}
          <section>
            <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-6">
              【令和6年1月31日時点の選任運転者数についてご記入下さい。】
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 space-y-2">
              <p>※1 トレーラ(被けん引車)を保有している場合、「保有車両数」はトラクタヘッド(けん引車)とトレーラの両方にご記入ください。</p>
              <p>※2 「運転者数」は、運転者台帳に記載されている全運転者が対象となります。</p>
              <p>※3 複数の免許を保有している運転者は、上位の免許欄(1つ)に人数をご記入ください。また、けん引免許を保有している運転者は、上位免許欄と「けん引」欄の両方に人数をご記入下さい。</p>
              <p>※4 平成19年6月2日から平成29年3月11日までに普通免許を取得した運転者は、「5t限定」欄に人数をご記入ください。</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-center">
                <thead className="bg-slate-50">
                  <tr>
                    <th colSpan={2} className="px-3 py-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">保有免許区分</th>
                    {licenseHeaders.map(h => (
                      <th key={h.key} className="px-2 py-2 border-r border-slate-200 whitespace-nowrap">
                        <div className="font-medium text-slate-700">{h.label}</div>
                        <div className="text-xs text-slate-500">{h.sub}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 font-bold text-slate-800 whitespace-nowrap bg-slate-100">(計)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {(Object.keys(ageLabels) as AgeGroup[]).map((age, ageIdx) => (
                    <React.Fragment key={age}>
                      {(Object.keys(genderLabels) as Gender[]).map((gender, genderIdx) => (
                        <tr key={`${age}-${gender}`} className={genderIdx === 1 ? 'border-b-2 border-slate-300' : ''}>
                          {genderIdx === 0 && (
                            <td rowSpan={2} className="px-3 py-4 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap bg-slate-50 align-middle">
                              {ageLabels[age]}
                            </td>
                          )}
                          <td className="px-3 py-2 text-slate-600 border-r border-slate-200 whitespace-nowrap bg-slate-50">
                            {genderLabels[gender]}
                          </td>
                          {licenseHeaders.map(h => (
                            <td key={h.key} className="px-2 py-2 border-r border-slate-200">
                              <input 
                                type="number" min="0" 
                                value={data.drivers[age][gender][h.key as LicenseType]} 
                                onChange={e => updateDriver(age, gender, h.key as LicenseType, e.target.value)} 
                                className="w-12 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" 
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">
                            {getDriverRowTotal(age, gender)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Recruitment */}
          <section>
            <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-6">
              【令和6年1月31日時点の運転者募集状況についてご記入下さい。】
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 space-y-2">
              <p>※1 募集にあたり、保有していて欲しい免許欄に人数をご記入ください。</p>
              <p>※2 けん引免許を保有している運転者を募集している場合は、上位の免許欄と「けん引」欄の両方に人数をご記入下さい。</p>
              <p>※3 募集を行っていない場合は、空白で結構です。</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-center">
                <thead className="bg-slate-50">
                  <tr>
                    <th colSpan={2} className="px-3 py-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">免許区分</th>
                    {licenseHeaders.map(h => (
                      <th key={h.key} className="px-2 py-2 border-r border-slate-200 whitespace-nowrap">
                        <div className="font-medium text-slate-700">{h.label}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 font-bold text-slate-800 whitespace-nowrap bg-slate-100">(計)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {(Object.keys(recruitGenderLabels) as RecruitGender[]).map((gender, idx) => (
                    <tr key={gender}>
                      {idx === 0 && (
                        <td rowSpan={3} className="px-3 py-4 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap bg-slate-50 align-middle">
                          募集人数
                        </td>
                      )}
                      <td className="px-3 py-2 text-slate-600 border-r border-slate-200 whitespace-nowrap bg-slate-50">
                        {recruitGenderLabels[gender]}
                      </td>
                      {licenseHeaders.map(h => (
                        <td key={h.key} className="px-2 py-2 border-r border-slate-200">
                          <input 
                            type="number" min="0" 
                            value={data.recruitment[gender][h.key as LicenseType]} 
                            onChange={e => updateRecruitment(gender, h.key as LicenseType, e.target.value)} 
                            className="w-12 text-center border-b border-slate-300 focus:border-indigo-500 outline-none" 
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">
                        {getRecruitRowTotal(gender)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-200 flex flex-col items-center">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg"
            >
              {status === 'submitting' ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
              ) : (
                <Save className="w-6 h-6" />
              )}
              {status === 'submitting' ? '送信中...' : 'アンケートを送信する'}
            </button>
            
            {status === 'success' && (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">送信が完了しました。ご協力ありがとうございました。</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">送信に失敗しました。時間をおいて再度お試しください。</p>
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
