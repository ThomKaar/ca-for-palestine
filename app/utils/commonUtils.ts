const DEFAULT_NUMBER = '18054416665';

export const normalizePhoneNumber = (s: string) => {
    const onlyNums = s.split('').filter((e) => !isNaN(parseInt(e)));
    if (onlyNums.length < 10) {
        return DEFAULT_NUMBER;
    }
    return onlyNums.join('');
};


export const inlcudeName = (body: string, firstName: string, lastName: string) => {
    if (body.includes('[Your Name]')) {
        body.replace('[Your Name]', firstName + ' ' + lastName);
    }
    return body;
};