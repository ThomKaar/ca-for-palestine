export const inlcudeName = (body: string, firstName: string, lastName: string) => {
    if (body.includes('[Your Name]')) {
        body.replace('[Your Name]', firstName + ' ' + lastName);
    }
    return body;
};