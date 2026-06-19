import { downloadICSReminder, getGoogleCalendarLink } from '@/lib/calendar';
import { Calendar, ExternalLink, Check } from 'lucide-react';

interface ReminderSectionProps {
  unlockDate: string; // datetime-local value
}

export function ReminderSection({ unlockDate }: ReminderSectionProps) {
  const unlock = new Date(unlockDate);

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-amber-400/80">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Set a Calendar Reminder</span>
      </div>

      <p className="text-white/30 text-xs">
        Add a reminder to your calendar so you don't forget to unlock your message on {unlock.toLocaleDateString()} at {unlock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => downloadICSReminder(unlock)}
          className="flex-1 py-2.5 border border-white/10 rounded-lg text-white/50 
                     hover:bg-white/5 hover:text-white/70 transition-all text-xs
                     flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          Download .ics
        </button>
        <a
          href={getGoogleCalendarLink(unlock)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 border border-white/10 rounded-lg text-white/50 
                     hover:bg-white/5 hover:text-white/70 transition-all text-xs
                     flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Google Calendar
        </a>
      </div>

      <div className="flex items-center gap-2 text-emerald-400/60 text-xs">
        <Check className="w-3 h-3" />
        <span>We store nothing. Your calendar app handles the reminder.</span>
      </div>
    </div>
  );
}
