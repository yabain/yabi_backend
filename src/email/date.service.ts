import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  currentLang: string;
  constructor() {}
  /**
   * Converts a date string from "YYYY-MM-DD" format to "Ddd, DD MMM YYYY" format.
   * @param {string} dateStr - The input date string in "YYYY-MM-DD" format.
   * @param {string} format - The format to return the date. "long" : "short"
   * @param {string} lang - The language to set the date. "en" : "fr"
   * @returns {string} The formatted date string in "Ddd, DD MMM YYYY" format.
   */
  formatDate(dateStr: string, format?: string, lang?: string) {
    if (!format) {
      format = 'short';
    }
    if (!lang) {
      lang = this.currentLang;
    }

    let days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    let months = [
      'Jan',
      'Fév',
      'Mars',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    if (format === 'short' && lang === 'en') {
      days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
    }

    if (format === 'long' && lang === 'fr') {
      const days = [
        'Dimanche',
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
      ];
      const months = [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
      ];
    }

    if (format === 'long' && lang === 'en') {
      days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
    }

    const date = new Date(dateStr);
    const dayName = days[date.getUTCDay()];
    const day = date.getUTCDate();
    const monthName = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    return `${dayName}, ${day.toString().padStart(2, '0')} ${monthName} ${year}`;
  }

  monthDate(dateStr: string, lang?: string): string {
    if (!lang) {
      lang = this.currentLang;
    }

    let months = [
      'Jan',
      'Fév',
      'Mars',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    if (lang === 'en') {
      months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
    }

    const date = new Date(dateStr);
    const monthName = months[date.getUTCMonth()];

    return `${monthName}`;
  }

  /**
   * Converts a 24-hour time string to a 12-hour English format.
   * @param time - A string in the format "HH:mm".
   * @returns A string in the format "hh:mm AM/PM".
   */
  convertTimeFormat(time: string): string {
    // Split the input time into hours and minutes
    const [hours, minutes] = time.split(':').map(Number);

    // Determine AM or PM
    const period = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    const hoursIn12Format = hours % 12 || 12;

    // Return the formatted time
    return `${hoursIn12Format.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  formatToISO(dateStr, timeStr) {
    // Ajouter les secondes par défaut
    const timeWithSeconds = `${timeStr}:00`;

    // Ajouter le fuseau horaire
    const timezoneOffset = '+01:00';

    // Combiner la date, l'heure et le fuseau horaire
    return `${dateStr}T${timeWithSeconds}${timezoneOffset}`;
  }

  formatTime(dateIn: string, lang?: string): string {
    if (!lang) {
      lang = this.currentLang;
    }

    const date = new Date(dateIn);

    const hours = date.getHours().toString().padStart(2, '0'); // Houre (21)
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Minutes (37)

    const time = `${hours}:${minutes}`; // Result : "21:37"
    if (lang == 'fr') {
      return time;
    } else return this.convertTimeFormat(time);
  }
}
