import React from 'react';
import { Shield, Lock, Eye, Globe, Server, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Language } from '../translations';

interface PrivacyPolicyProps {
  language: Language;
  onClose: () => void;
}

const PrivacyPolicy = ({ language, onClose }: PrivacyPolicyProps) => {
  const content = {
    en: {
      title: 'Privacy Letter',
      subtitle: 'How we handle your data',
      intro: 'At SmartCart, we believe your shopping data is your business. This letter explains our simple, privacy-first approach.',
      sections: [
        {
          icon: <Lock className="w-5 h-5 text-indigo-500" />,
          title: 'Local Storage Only',
          text: 'All your shopping items, history, and budget settings are stored exclusively on your device. We do not have a database and we cannot see what you buy.'
        },
        {
          icon: <Shield className="w-5 h-5 text-indigo-500" />,
          title: 'No Tracking',
          text: 'We do not use cookies for tracking or advertising. There are no third-party analytics scripts monitoring your behavior.'
        },
        {
          icon: <Globe className="w-5 h-5 text-indigo-500" />,
          title: 'AI Generation',
          text: 'When you use the Showcase feature to generate icons or mockups, your prompts are sent to Google Gemini API. Please do not include personal information in your prompts.'
        },
        {
          icon: <UserCheck className="w-5 h-5 text-indigo-500" />,
          title: 'Your Control',
          text: 'You can clear all your history and data at any time from the Settings menu. Once deleted, it is gone forever as we don\'t keep backups.'
        }
      ],
      footer: 'Simple. Private. Secure.'
    },
    de: {
      title: 'Datenschutzerklärung',
      subtitle: 'Wie wir mit Ihren Daten umgehen',
      intro: 'Bei SmartCart glauben wir, dass Ihre Einkaufsdaten Privatsache sind. Dieser Brief erklärt unseren einfachen, datenschutzorientierten Ansatz.',
      sections: [
        {
          icon: <Lock className="w-5 h-5 text-indigo-500" />,
          title: 'Nur lokale Speicherung',
          text: 'Alle Ihre Einkaufsartikel, der Verlauf und die Budgeteinstellungen werden ausschließlich auf Ihrem Gerät gespeichert. Wir haben keine Datenbank und können nicht sehen, was Sie kaufen.'
        },
        {
          icon: <Shield className="w-5 h-5 text-indigo-500" />,
          title: 'Kein Tracking',
          text: 'Wir verwenden keine Cookies für Tracking oder Werbung. Es gibt keine Analyse-Skripte von Drittanbietern, die Ihr Verhalten überwachen.'
        },
        {
          icon: <Globe className="w-5 h-5 text-indigo-500" />,
          title: 'KI-Generierung',
          text: 'Wenn Sie die Showcase-Funktion zur Generierung von Icons oder Mockups nutzen, werden Ihre Prompts an die Google Gemini API gesendet. Bitte geben Sie keine persönlichen Informationen in Ihren Prompts an.'
        },
        {
          icon: <UserCheck className="w-5 h-5 text-indigo-500" />,
          title: 'Ihre Kontrolle',
          text: 'Sie können Ihren gesamten Verlauf und Ihre Daten jederzeit im Einstellungsmenü löschen. Einmal gelöscht, sind sie für immer weg, da wir keine Backups erstellen.'
        }
      ],
      footer: 'Einfach. Privat. Sicher.'
    },
    es: {
      title: 'Carta de Privacidad',
      subtitle: 'Cómo manejamos tus datos',
      intro: 'En SmartCart, creemos que tus datos de compra son asunto tuyo. Esta carta explica nuestro enfoque simple y centrado en la privacidad.',
      sections: [
        {
          icon: <Lock className="w-5 h-5 text-indigo-500" />,
          title: 'Solo Almacenamiento Local',
          text: 'Todos tus artículos de compra, historial y ajustes de presupuesto se guardan exclusivamente en tu dispositivo. No tenemos base de datos y no podemos ver lo que compras.'
        },
        {
          icon: <Shield className="w-5 h-5 text-indigo-500" />,
          title: 'Sin Rastreo',
          text: 'No usamos cookies para rastreo ni publicidad. No hay scripts de análisis de terceros monitoreando tu comportamiento.'
        },
        {
          icon: <Globe className="w-5 h-5 text-indigo-500" />,
          title: 'Generación por IA',
          text: 'Al usar la función Showcase para generar iconos o maquetas, tus instrucciones se envían a la API de Google Gemini. Por favor, no incluyas información personal en tus instrucciones.'
        },
        {
          icon: <UserCheck className="w-5 h-5 text-indigo-500" />,
          title: 'Tu Control',
          text: 'Puedes borrar todo tu historial y datos en cualquier momento desde el menú Ajustes. Una vez borrados, desaparecen para siempre ya que no guardamos copias de seguridad.'
        }
      ],
      footer: 'Simple. Privado. Seguro.'
    },
    ru: {
      title: 'Политика конфиденциальности',
      subtitle: 'Как мы обрабатываем ваши данные',
      intro: 'В SmartCart мы считаем, что данные о ваших покупках — это ваше личное дело. Письмо ниже объясняет наш простой подход, ориентированный на конфиденциальность.',
      sections: [
        {
          icon: <Lock className="w-5 h-5 text-indigo-500" />,
          title: 'Только локальное хранение',
          text: 'Все ваши товары, история и настройки бюджета хранятся исключительно на вашем устройстве. У нас нет базы данных, и мы не видим, что вы покупаете.'
        },
        {
          icon: <Shield className="w-5 h-5 text-indigo-500" />,
          title: 'Никакого отслеживания',
          text: 'Мы не используем файлы cookie для отслеживания или рекламы. У нас нет сторонних аналитических скриптов, следящих за вашим поведением.'
        },
        {
          icon: <Globe className="w-5 h-5 text-indigo-500" />,
          title: 'Генерация через ИИ',
          text: 'Когда вы используете функцию Showcase для создания иконок или макетов, ваши запросы отправляются в Google Gemini API. Пожалуйста, не указывайте личную информацию в запросах.'
        },
        {
          icon: <UserCheck className="w-5 h-5 text-indigo-500" />,
          title: 'Ваш контроль',
          text: 'Вы можете в любой момент удалить всю историю и данные в меню настроек. После удаления они исчезнут навсегда, так как мы не храним резервные копии.'
        }
      ],
      footer: 'Просто. Приватно. Безопасно.'
    }
  };

  const t = content[language] || content.en;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-3xl p-6 shadow-2xl space-y-6 max-h-[80vh] overflow-y-auto border border-slate-100"
    >
      <div className="space-y-2 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">{t.title}</h2>
        <p className="text-sm text-slate-500">{t.subtitle}</p>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed text-center px-4">
        {t.intro}
      </p>

      <div className="grid gap-4 mt-6">
        {t.sections.map((section, i) => (
          <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
            <div className="flex-shrink-0 mt-1">
              {section.icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800">{section.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {section.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 text-center space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
          {t.footer}
        </p>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
        >
          {language === 'ru' ? 'Понятно' : 
           language === 'de' ? 'Verstanden' : 
           language === 'es' ? 'Entendido' : 'Got it'}
        </button>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
