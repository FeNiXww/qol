import { differenceInYears, parseISO } from 'date-fns';

export function getAge(birthdate) {
  return differenceInYears(new Date(), parseISO(birthdate));
}

export function getAgeBand(birthdate) {
  const age = getAge(birthdate);
  return age < 18 ? 'minor' : 'adult';
}

export function isAtLeast14(birthdate) {
  return getAge(birthdate) >= 14;
}

export function getOppositeNationality(nationality) {
  return nationality === 'israeli' ? 'palestinian' : 'israeli';
}