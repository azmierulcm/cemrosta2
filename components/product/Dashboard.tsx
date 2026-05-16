'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clock, MapPin, Hotel, Download, Upload, ChevronDown, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { DutyEvent } from '@/lib/types';
import { generateICS, downloadICS } from '@/lib/utils/calendar';
import { DutyCalendar } from './DutyCalendar';
import { DestinationPatch } from './DestinationPatch';
import { FileUploader } from './FileUploader';

export const EventCard = ({ event, index }: { event: DutyEvent; index: number }) => {
  const isFlight = event.type === 'FLIGHT';
  const isStandby = event.type === 'STANDBY';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-border mb-8 group hover:shadow-2xl hover:shadow-black/5 transition-all relative overflow-hidden"
    >
      {isFlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/3 blur-[40px] -mr-16 -mt-16 rounded-full" />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
        <div className="flex items-start gap-8">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
            ${isFlight ? 'bg-accent/5 text-accent border border-accent/10' : 'bg-orange-50 text-orange-600 border border-orange-100'}
          `}>
            {isFlight ? <Plane className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] font-mono bg-surface-2 px-3 py-1 rounded-full border border-border">
                {event.date}
              </span>
              {isStandby && (
                <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                  Standby Duty
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-text tracking-tighter">
              {isFlight ? `Flight ${event.flightNumber}` : `Duty Code: ${event.id}`}
            </h3>
            {isFlight && (
              <div className="flex items-center gap-3 mt-3 text-text-muted font-bold text-xl tracking-tight">
                <span className="text-text">{event.depPort}</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/30" />
                  <div className="w-8 h-[2px] bg-accent/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                <span className="text-text">{event.arrPort}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 md:text-right">
          <div className="bg-surface-2 px-6 py-4 rounded-2xl border border-border shadow-sm min-w-[120px]">
            <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] mb-2 font-mono">Sign On</p>
            <p className="text-2xl font-black text-text font-mono">{event.signOn || event.std || '--:--'}</p>
          </div>
          <div className="bg-surface-2 px-6 py-4 rounded-2xl border border-border shadow-sm min-w-[120px]">
            <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] mb-2 font-mono">Sign Off</p>
            <p className="text-2xl font-black text-text font-mono">{event.signOff || event.sta || '--:--'}</p>
          </div>
        </div>
      </div>

      {isFlight && event.std && (
        <div className="mt-8 flex flex-wrap items-center gap-10 text-[10px] text-text-subtle font-black uppercase tracking-[0.15em] font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center border border-border">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <span>STD {event.std}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center border border-border">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <span>STA {event.sta || '--:--'}</span>
          </div>
        </div>
      )}

      {event.hotel && (
        <div className="mt-10 pt-10 border-t border-border flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
              <Hotel className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="font-black text-text uppercase text-xs tracking-widest font-mono">Layover Operations:</span>
          </div>
          <span className="bg-accent/5 border border-accent/10 px-5 py-2.5 rounded-full text-accent font-black text-sm tracking-tight shadow-sm">{event.hotel}</span>
        </div>
      )}
    </motion.div>
  );
};

export const Dashboard = () => {
  const { activeRoster, rosters, activeRosterId, selectRoster, deleteRoster, isLoading } = useRoster();
  const [showUpload, setShowUpload] = useState(false);
  const [showRosterPicker, setShowRosterPicker] = useState(false);
  // ID of the roster currently pending delete confirmation (null = none)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!activeRoster) return null;

  const handleExport = () => {
    const icsContent = generateICS(activeRoster);
    if (icsContent) {
      downloadICS(icsContent, `roster-${activeRoster.month}-${activeRoster.year}.ics`);
    }
  };

  const activeLabel = `${activeRoster.month} ${activeRoster.year}`;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-32 pt-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
            <MapPin size={12} className="text-accent" />
            Mission Control
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-text">Your Schedule.</h2>

          {/* Roster Selector */}
          <div className="relative mt-4">
            <button
              onClick={() => setShowRosterPicker((v) => !v)}
              className="flex items-center gap-3 text-text-muted font-bold text-lg tracking-tight hover:text-text transition-colors group"
            >
              <Calendar size={16} className="text-accent" />
              {activeLabel}
              <span className="mx-1 text-border">·</span>
              <span>{activeRoster.events.length} Events</span>
              {rosters.length > 1 && (
                <ChevronDown size={16} className={`transition-transform ${showRosterPicker ? 'rotate-180' : ''}`} />
              )}
            </button>

            <AnimatePresence>
              {showRosterPicker && rosters.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 mt-3 bg-white border border-border rounded-[1.5rem] shadow-2xl shadow-black/10 z-50 overflow-hidden min-w-[280px]"
                >
                  {rosters.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center border-b border-border/50 last:border-0 group ${r.id === activeRosterId ? 'bg-accent/5' : ''}`}
                    >
                      {confirmDeleteId === r.id ? (
                        /* ── Confirm-delete row ── */
                        <div className="flex items-center gap-3 w-full px-6 py-4">
                          <AlertTriangle size={14} className="text-red-500 shrink-0" />
                          <span className="text-xs font-bold text-text flex-1">Delete {r.month} {r.year}?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoster(r.id);
                              setConfirmDeleteId(null);
                              setShowRosterPicker(false);
                            }}
                            className="text-[10px] font-black uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-text px-3 py-1 rounded-full border border-border transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        /* ── Normal row ── */
                        <>
                          <button
                            onClick={() => { selectRoster(r.id); setShowRosterPicker(false); }}
                            className="flex-1 text-left px-6 py-4 hover:bg-surface-2 transition-colors"
                          >
                            <p className={`font-bold text-sm ${r.id === activeRosterId ? 'text-accent' : 'text-text'}`}>
                              {r.month} {r.year}
                            </p>
                            <p className="text-[10px] font-black text-text-subtle uppercase tracking-widest font-mono mt-0.5">
                              {r.totalSectors} Flights · {r.uniqueDestinations} Destinations
                            </p>
                          </button>
                          <div className="flex items-center gap-2 pr-4">
                            {r.id === activeRosterId && (
                              <div className="w-2 h-2 rounded-full bg-accent" />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
                              aria-label={`Delete ${r.month} ${r.year} roster`}
                              className="w-8 h-8 flex items-center justify-center rounded-full text-text-subtle hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="px-8 py-4 rounded-full font-bold text-text-muted hover:bg-surface-2 hover:text-text transition-all active:scale-95 border border-transparent hover:border-border flex items-center gap-2"
          >
            <Upload size={18} strokeWidth={2.5} />
            {showUpload ? 'Cancel' : 'Upload Another'}
          </button>
          <button
            onClick={handleExport}
            className="bg-accent text-accent-fg px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 shadow-xl shadow-accent/10 hover:bg-accent-hover transition-all active:scale-95"
          >
            <Download className="w-6 h-6" strokeWidth={2.5} />
            Download ICS
          </button>
        </div>
      </div>

      {/* Inline Upload Zone */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-16"
          >
            <div className="bg-white border border-border rounded-[2rem] p-10">
              <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.4em] font-mono mb-8">
                {"// ADD ANOTHER MONTH"}
              </p>
              <FileUploader onSuccess={() => setShowUpload(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state when switching rosters */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Destinations Section */}
          {activeRoster.destinations && activeRoster.destinations.length > 0 && (
            <section className="mb-24">
              <div className="flex items-center justify-between mb-10 border-b border-border pb-8">
                <h3 className="text-3xl font-bold text-text tracking-tighter uppercase italic">Recent Stamps.</h3>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono bg-surface-2 px-4 py-2 rounded-full border border-border">
                  {activeRoster.destinations.length} Unlocked
                </div>
              </div>
              <div className="flex gap-8 overflow-x-auto pb-10 -mx-4 px-4 scrollbar-hide">
                {activeRoster.destinations.map((dest) => (
                  <DestinationPatch key={dest.iata} destination={dest} />
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 relative">
              <div className="flex items-center gap-4 mb-12">
                <h3 className="text-3xl font-bold text-text tracking-tighter uppercase italic">Timeline.</h3>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <div className="absolute left-8 top-32 bottom-0 w-px bg-surface-2 -z-10" />
              {activeRoster.events.map((event, index) => (
                <EventCard key={event.id + index} event={event} index={index} />
              ))}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-32">
                <div className="flex items-center gap-4 mb-12">
                  <h3 className="text-3xl font-bold text-text tracking-tighter uppercase italic">Calendar.</h3>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <DutyCalendar />

                <div className="mt-12 p-8 bg-surface-2 border border-border rounded-[2rem] text-center">
                  <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.4em] font-mono mb-6">
                    {"// MISSION SUPPORT"}
                  </p>
                  <p className="text-sm font-bold text-text-muted leading-snug">
                    Found an error in your roster parsing? <br />
                    Report it to our flight deck.
                  </p>
                  <button className="mt-6 text-accent font-black text-[10px] uppercase tracking-widest hover:underline">
                    Open Support Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
