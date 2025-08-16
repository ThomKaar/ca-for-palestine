const DEFAULT_NUMBER = '18054416665';
export const REPS = ['Schiff', 'Padilla'];

export const normalizePhoneNumber = (s: string) => {
    const onlyNums = s.split('').filter((e) => !isNaN(parseInt(e)));
    if (onlyNums.length < 10) {
        return DEFAULT_NUMBER;
    }
    return onlyNums.join('');
};
