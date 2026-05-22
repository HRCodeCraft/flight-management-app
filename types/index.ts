export type FlightStatus = 'scheduled' | 'delayed' | 'cancelled' | 'departed' | 'arrived';
export type SeatClass = 'economy' | 'business' | 'first';
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled';

export interface Flight {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: FlightStatus;
  base_price: number;
}

export interface Seat {
  id: string;
  flight_id: string;
  seat_number: string;
  class: SeatClass;
  is_available: boolean;
  extra_fee: number;
}

export interface Booking {
  id: string;
  user_id: string;
  flight_id: string;
  seat_id: string;
  status: BookingStatus;
  booked_at: string;
  total_price: number;
  pnr_code: string;
  flight?: Flight;
  seat?: Seat;
  passengers?: Passenger[];
}

export interface Passenger {
  id: string;
  booking_id: string;
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
}

export interface Reschedule {
  id: string;
  booking_id: string;
  old_flight_id: string;
  new_flight_id: string;
  requested_at: string;
  fee_charged: number;
}

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
  passenger_count: number;
}

export interface PassengerFormData {
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
}

export type BookingStep = 'search' | 'results' | 'seats' | 'details' | 'confirmation';

export const AIRPORTS: { code: string; city: string; country: string }[] = [
  { code: 'DEL', city: 'New Delhi', country: 'India' },
  { code: 'BOM', city: 'Mumbai', country: 'India' },
  { code: 'BLR', city: 'Bangalore', country: 'India' },
  { code: 'MAA', city: 'Chennai', country: 'India' },
  { code: 'CCU', city: 'Kolkata', country: 'India' },
  { code: 'HYD', city: 'Hyderabad', country: 'India' },
  { code: 'COK', city: 'Kochi', country: 'India' },
  { code: 'PNQ', city: 'Pune', country: 'India' },
];
