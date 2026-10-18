import { useContext } from 'react';
import { MyParkingContext, type MyParkingContextValue } from '../context/myParkingContext';

export function useMyParking(): MyParkingContextValue {
  const value = useContext(MyParkingContext);
  if (!value) {
    throw new Error('useMyParking debe usarse dentro de <MyParkingProvider>.');
  }
  return value;
}
