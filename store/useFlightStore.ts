import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SearchQuery, Flight, Seat, PassengerFormData, BookingStep } from '@/types';

interface FlightState {
  searchQuery: SearchQuery | null;
  selectedFlight: Flight | null;
  selectedSeat: Seat | null;
  currentStep: BookingStep;
  passengerData: PassengerFormData | null;

  setSearchQuery: (query: SearchQuery) => void;
  setSelectedFlight: (flight: Flight | null) => void;
  setSelectedSeat: (seat: Seat | null) => void;
  setCurrentStep: (step: BookingStep) => void;
  setPassengerData: (data: PassengerFormData) => void;
  resetBooking: () => void;
  resetAll: () => void;
}

const initialState = {
  searchQuery: null,
  selectedFlight: null,
  selectedSeat: null,
  currentStep: 'search' as BookingStep,
  passengerData: null,
};

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      ...initialState,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setPassengerData: (data) => set({ passengerData: data }),

      resetBooking: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          currentStep: 'search',
          passengerData: null,
        }),

      resetAll: () => set(initialState),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      // Exclude passport_no from being persisted
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        currentStep: state.currentStep,
        // passengerData excluded — contains sensitive passport info
      }),
    }
  )
);
