declare module "hebcal" {
  export class HDate {
    constructor(date: Date);
    constructor(day: number, month: number, year: number);

    getDate(): number;
    getMonth(): number;
    getFullYear(): number;
    isLeapYear(): boolean;
    greg(): Date;
  }

  export function gematriya(value: number): string;
}
