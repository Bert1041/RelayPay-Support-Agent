'use client'

import { useState } from 'react'
import { CircleCheckIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { cn } from '@/shared/lib/utils'

interface CalendarAppointmentBookingProps {
  onConfirm: (date: Date, time: string) => void;
  onCancel?: () => void;
}

const CalendarAppointmentBooking = ({ onConfirm, onCancel }: CalendarAppointmentBookingProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const timeSlots = Array.from({ length: 33 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  // Example of booked dates (could be passed from props in a real app)
  const bookedDates = [
    new Date(new Date().setDate(new Date().getDate() + 1)),
    new Date(new Date().setDate(new Date().getDate() + 2)),
  ]

  const handleConfirm = () => {
    if (date && selectedTime) {
      onConfirm(date, selectedTime);
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <Card className='gap-0 p-0 border-none shadow-none bg-transparent'>
        <CardHeader className='flex h-max justify-center border-b border-[#14213D]/5 !p-6 bg-white/50 backdrop-blur-md rounded-t-3xl'>
          <CardTitle className="text-xl font-bold text-[#14213D] text-center">Schedule Verification Call</CardTitle>
        </CardHeader>
        <CardContent className='relative p-0 md:pr-48 bg-white/30 backdrop-blur-sm'>
          <div className='p-6 flex justify-center'>
            <Calendar
              mode='single'
              selected={date}
              onSelect={setDate}
              defaultMonth={date}
              disabled={{ before: new Date() }}
              showOutsideDays={false}
              modifiers={{
                booked: bookedDates
              }}
              modifiersClassNames={{
                booked: '[&>button]:line-through opacity-50'
              }}
              className='p-0'
              formatters={{
                formatWeekdayName: date => {
                  return date.toLocaleString('en-US', { weekday: 'short' })
                }
              }}
            />
          </div>
          <div className='inset-y-0 right-0 flex w-full flex-col gap-4 border-t border-[#14213D]/5 max-md:h-60 md:absolute md:w-48 md:border-t-0 md:border-l'>
            <ScrollArea className='h-full'>
              <div className='flex flex-col gap-2 p-6'>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#14213D]/40 mb-2">Available Slots</span>
                <span className="text-[8px] font-bold text-[#2A9D8F]/60 uppercase tracking-widest mb-4">Africa/Lagos (GMT+1)</span>
                {timeSlots.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      'w-full shadow-none rounded-xl transition-all',
                      selectedTime === time 
                        ? 'bg-[#2A9D8F] text-white hover:bg-[#2A9D8F]/90' 
                        : 'border-[#14213D]/5 hover:bg-[#14213D]/5'
                    )}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-4 border-t border-[#14213D]/5 px-8 !py-6 md:flex-row bg-white/50 backdrop-blur-md rounded-b-3xl'>
          <div className='flex items-center gap-3 text-sm flex-1'>
            {date && selectedTime ? (
              <>
                <div className="bg-[#2A9D8F]/10 p-2 rounded-full">
                  <CircleCheckIcon className='size-5 stroke-[#2A9D8F]' />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-[#14213D]/40 leading-none mb-1">Africa/Lagos Selection</span>
                  <span className="text-[#14213D] font-medium leading-tight">
                    {date?.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long'
                    })} at <span className='font-bold'>{selectedTime} (WAT)</span>
                  </span>
                </div>
              </>
            ) : (
              <span className="text-[#14213D]/40 font-medium italic">Select a valid protocol window...</span>
            )}
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             {onCancel && (
                <Button variant="ghost" onClick={onCancel} className="flex-1 md:flex-none uppercase text-[10px] font-bold tracking-widest text-red-500 hover:bg-red-50">
                  Cancel
                </Button>
             )}
             <Button 
                disabled={!date || !selectedTime} 
                onClick={handleConfirm}
                className='flex-1 md:flex-none md:w-40 rounded-full bg-[#14213D] text-white hover:bg-black p-6 font-bold uppercase tracking-widest text-[10px]'
              >
                Confirm Call
              </Button>
          </div>
        </CardFooter>
      </Card>
      <p className='text-muted-foreground mt-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#14213D]/20' role='region'>
        Authenticated Scheduling Gateway
      </p>
    </div>
  )
}

export default CalendarAppointmentBooking
