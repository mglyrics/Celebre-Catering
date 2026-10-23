import React, { useState, useMemo } from 'react';
import { Meal, DrinkModification } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import { Plus, Check, Info, Sparkles, Coffee, Search, ShoppingBag } from 'lucide-react';

interface MenuSectionProps {
  meals: Meal[];
  onAddMealToOrder: (meal: Meal, quantity: number, drinkOption: DrinkModification) => void;
  onOpenBooking: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  meals,
  onAddMealToOrder,
  onOpenBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'mix_box' | 'sandwich_box'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedMealCode, setAddedMealCode] = useState<string | null>(null);

  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      if (!meal.isActive) return false;
      const matchesTab = activeTab === 'all' || meal.category === activeTab;
      const matchesSearch =
        meal.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.ingredients.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [meals, activeTab, searchQuery]);

  const handleQuickAdd = (meal: Meal) => {
    onAddMealToOrder(meal, 1, 'standard');
    setAddedMealCode(meal.code);
    setTimeout(() => {
      setAddedMealCode(null);
    }, 1800);
  };

  return (
    <section id="menu" className="py-16 sm:py-24 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C59B27]/15 text-[#7A0C2E] text-xs font-bold border border-[#C59B27]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>المنيو الرسمي والأسعار المعتمدة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#560820] tracking-tight">
            قائمة الوجبات الرسمية (18 وجبة)
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            جميع الوجبات تُعبأ في <span className="font-bold text-[#7A0C2E]">العلبة البيضاء الرسمية المعتمدة</span> وتتضمن عصير بخيرة وشوكة ومنديل معطر. الأسعار المعروضة هي أسعار الموزع الرسمية.
          </p>
        </div>

        {/* Drink Policy Notification Banner */}
        <div className="mb-10 p-4 sm:p-5 bg-white rounded-2xl border border-[#E5D7B7] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] text-[#C59B27] border border-[#EBDDC3]">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#7A0C2E]">شروط وخيارات تعديل المشروبات:</h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                • <strong>استبعاد العصير:</strong> يخصم <span className="text-emerald-700 font-bold">5 جنيه</span> من سعر كل وجبة. <br className="hidden sm:inline" />
                • <strong>استبدال العصير ببيبسي:</strong> يضيف <span className="text-blue-700 font-bold">10 جنيه</span> لسعر كل وجبة.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBooking}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#7A0C2E] hover:bg-[#560820] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-[#DFC066]" />
            <span>بدء حجز الطلب المخصص</span>
          </button>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Tabs */}
          <div className="flex items-center p-1.5 bg-white rounded-2xl border border-[#E2D5BA] shadow-2xs w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#7A0C2E] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#7A0C2E]'
              }`}
            >
              الكل (18 وجبة)
            </button>
            <button
              onClick={() => setActiveTab('mix_box')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'mix_box'
                  ? 'bg-[#7A0C2E] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#7A0C2E]'
              }`}
            >
              أولاً: ميكس بوكس (12)
            </button>
            <button
              onClick={() => setActiveTab('sandwich_box')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'sandwich_box'
                  ? 'bg-[#7A0C2E] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#7A0C2E]'
              }`}
            >
              ثانياً: سندوتش بوكس (6)
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو المكونات (كفتة، رومي...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-white border border-[#E2D5BA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A0C2E] focus:border-transparent text-slate-800 placeholder-slate-400"
            />
          </div>

        </div>

        {/* Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeals.map((meal) => {
            const isJustAdded = addedMealCode === meal.code;

            return (
              <div
                key={meal.id || meal.code}
                className="bg-white rounded-2xl border border-[#E8DCC0] hover:border-[#C59B27] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header with Code and Category */}
                  <div className="bg-[#FAF8F5] px-5 py-3 border-b border-[#F0E6D2] flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-[#7A0C2E] bg-white px-2.5 py-1 rounded-lg border border-[#EBDDC3] shadow-2xs">
                      {meal.code}
                    </span>
                    <span className="text-xs font-semibold text-[#C59B27] bg-[#C59B27]/10 px-2.5 py-0.5 rounded-full">
                      {meal.category === 'mix_box' ? 'ميكس بوكس' : 'سندوتش بوكس'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base sm:text-lg text-[#560820] group-hover:text-[#7A0C2E] transition-colors leading-snug">
                      {meal.name}
                    </h3>

                    {/* Verbatim Ingredients */}
                    <div className="bg-[#FDFCFA] rounded-xl p-3 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        المكونات طبقاً للوصف المعتمد:
                      </span>
                      <ul className="space-y-1">
                        {meal.ingredients.split('+').map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] flex-shrink-0" />
                            <span>{item.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Packaging Reminder */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="text-[#C59B27]">★</span>
                      <span>العلبة البيضاء الرسمية + شوكة ومنديل معطر</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Price and Add to Order CTA */}
                <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#F0E6D2] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block">
                      سعر الموزع
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#7A0C2E]">
                        {meal.distributorPrice}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        جنيه
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickAdd(meal)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white hover:bg-[#7A0C2E] text-[#7A0C2E] hover:text-white border border-[#C59B27]'
                      }`}
                      title="إضافة سريعة للطلب"
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تمت الإضافة!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة للطلب</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredMeals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-base font-semibold text-slate-600">
              لم يتم العثور على وجبات تطابق بحثك "{searchQuery}"
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="mt-3 text-xs font-bold text-[#7A0C2E] underline"
            >
              إعادة تعيين البحث
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
