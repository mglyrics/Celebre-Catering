import React from 'react';
import { CELEBRE_CONFIG } from '../data/defaultMeals';
import { ShieldCheck, Award, HeartHandshake, MapPin, Phone, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-white border-t border-[#EBDDC3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7A0C2E]/10 text-[#7A0C2E] text-xs font-bold border border-[#7A0C2E]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>الجودة والريادة في التجهيز الفندقي</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#560820] tracking-tight">
            عن سيليبري كاترينج (CÉLÈBRE)
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            نسعى لتقديم تجربة ضيافة استثنائية في أرقى مناسباتكم عبر الالتزام بأعلى معايير سلامة الغذاء، والتعبئة الفاخرة، والتوصيل المنضبط في الموعد المحدد.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E8DCC0] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white text-[#7A0C2E] border border-[#EBDDC3] flex items-center justify-center shadow-xs">
              <Award className="w-6 h-6 text-[#C59B27]" />
            </div>
            <h3 className="font-bold text-lg text-[#560820]">
              العلبة البيضاء الرسمية المعتمدة
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              جميع وجباتنا تُعبأ حصرياً في العلبة البيضاء الرسمية لـ Celebre Catering، والمزودة بختم الجودة ورمز الاستجابة السريع SCAN ME لضمان أصالة المنتج.
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E8DCC0] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white text-[#7A0C2E] border border-[#EBDDC3] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-[#560820]">
              تجهيز فندقي وطازج بالكامل
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              يتم تجهيز اللحوم والدواجن والمخبوزات والحلويات الشرقية والغربية في مصانعنا ومطابخنا المركزية تحت إشراف صحي صارم ووفقاً للوصف المعتمد حرفياً.
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E8DCC0] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white text-[#7A0C2E] border border-[#EBDDC3] flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-6 h-6 text-[#C59B27]" />
            </div>
            <h3 className="font-bold text-lg text-[#560820]">
              خدمة القاعات والأفراح الكبرى
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              خبرة واسعة في توريد آلاف الوجبات لأكبر قاعات الأفراح والمؤتمرات في القاهرة والجيزة والمحافظات مع أسطول سيارات مجهزة للتسليم في الوقت المحدد.
            </p>
          </div>

        </div>

        {/* Visual Showcase: Stacks & Presentation */}
        <div id="packaging" className="bg-[#FAF8F5] rounded-3xl border-2 border-[#E5D7B7] p-6 sm:p-10 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#C59B27] tracking-wider uppercase">
                معايير التعبئة والتسليم
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#560820]">
                العلبة البيضاء الفاخرة.. عنوان تميز ضيافتك
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                صممت العلبة الخارجية لـ Celebre بعناية فائقة لتجمع بين المظهر الأنيق الراقي والحفاظ على درجة حرارة وجودة المكونات. تتضمن كل علبة:
              </p>
              
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C59B27] flex-shrink-0" />
                  <span>تغليف غذائي آمن ومغلق لكل عنصر داخلي (الجاتوه، السندوتشات، المخبوزات).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C59B27] flex-shrink-0" />
                  <span>منديل معطر فاخر وشوكة لتجربة تناول مريحة لضيوفكم.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C59B27] flex-shrink-0" />
                  <span>عصير بخيرة القياسي مع إمكانية تعديل المشروب طبقاً لرغبتكم.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C59B27] flex-shrink-0" />
                  <span>تتبع دقيق وتوريد في صناديق كرتونية مجمعة تسهل التوزيع على طاولات القاعة.</span>
                </li>
              </ul>

              <div className="pt-2">
                <a
                  href={`https://wa.me/${CELEBRE_CONFIG.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-100" />
                  <span>تواصل مباشرة عبر واتساب</span>
                </a>
              </div>
            </div>

            {/* Photos collage */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl overflow-hidden shadow-md aspect-3/4 bg-slate-100">
                <img
                  src={CELEBRE_CONFIG.boxImage}
                  alt="Celebre Wedding Hall Stacks"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md aspect-3/4 bg-slate-100">
                <img
                  src="/assets/aistudio/________________47cab4f5.jpg"
                  alt="Inside Celebre Official Box"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
