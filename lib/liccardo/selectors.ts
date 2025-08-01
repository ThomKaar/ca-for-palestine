import { Page } from 'puppeteer';


export const getFirstNameInput  = async (page: Page) => {
    return await page.$('#edit-first-name-2');
};

export const getLastNameInput = async (page: Page) => {
    return await page.$('#edit-last-name-2');
};

export const getPrefixInput  = async (page: Page) => {
    return await page.$('#edit-honorific-2');
};

export const getEmail = async (page: Page) => {
    return await page.$('#edit-email-9');
};

export const phoneNumber = async (page: Page) => {
    return await page.$('#edit-number-18');
};

export const issueSelect = async (page: Page) => {
    return await page.$('#edit-issue-23');
};

export const getMessage  = async (page: Page) => {
    return await page.$('#edit-comments-23');
}

export const sendMeResponse = async (page: Page) => {
    return await page.$('#edit-response-23');
}

export const captcha = async (page: Page) => {
    return await page.$('.h-captcha #checkbox');
};