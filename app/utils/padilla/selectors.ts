import { Page } from 'puppeteer';

const assignElementValue = (e: HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement | null, value: string) => {
  if (e) {
    e.value = value;
  }
  return;
};


export const selectFeedback = async (page: Page) => {
    const select = await page.$('form[id="gform_1"] select[id="input_1_23"]');
    await page.evaluate(assignElementValue, select, 'contact');
    return select;
}

export const firstName = async (page: Page, name: string) => {
    const input = await page.$('input[id="input_1_2"]');
    await page.evaluate(assignElementValue, input, name);
    return input;
};

export const lastName = async (page: Page, name: string) => {
    const input = await page.$('input[id="input_1_3"]');
    await page.evaluate(assignElementValue, input, name);
    return input;
};

export const getStreetAddressOne = async (page: Page, addy: string) => {
    const input = await page.$('input[id="input_1_6_1"]');
    await page.evaluate(assignElementValue, input, addy);
    return input;
};

export const getStreetAddressTwo = async (page: Page, addy2: string) => {
    const input = await page.$('input[id="input_1_6_2"]');
    await page.evaluate(assignElementValue, input, addy2);
    return input;
};

export const getCity = async (page: Page, city: string) => {
    const input = await page.$('input[id="input_1_6_3"]');
    await page.evaluate(assignElementValue, input, city);
    return input;
};

export const getZipCode = async (page: Page, zip: string) => {
    const input = await page.$('input[id="input_1_6_5"]');
    await page.evaluate(assignElementValue, input, zip);
    return input;
};

export const getPhoneNumber = async (page: Page, phoneNumber: string) => {
    const input = await page.$('input[id="input_1_7"]');
    await page.evaluate(assignElementValue, input, phoneNumber);
    return input;
};

export const getEmail = async (page: Page, email: string) => {
    const input = await page.$('input[id="input_1_9"]');
    await page.evaluate(assignElementValue, input, email);
};

export const getEmailConfirmation = async (page: Page, email: string) => {
    const input = await page.$('input[id="input_1_9_2"]');
    await page.evaluate(assignElementValue, input, email);
};

export const messageTopic = async (page: Page) => {
    const select = await page.$('select[id="input_1_17"]');
    await page.evaluate(assignElementValue, select, 'FR');
    return select;
};

export const getSubjectInput = async (page: Page, subject: string) => {
    const input = await page.$('input[id="input_1_11"]');
    await page.evaluate(assignElementValue, input, subject);
    return input;
};

export const getMessageTextArea = async (page: Page, message: string) => {
    const textarea = await page.$('textarea[id="input_1_12"]');
    await page.evaluate(assignElementValue, textarea, message);
    return textarea;
}

export const noUpdates = async (page: Page) => {
    const noInput  = await page.$('input[id="choice_1_18_1"]');
    await noInput?.click();
    return noInput;
};

export const submitForm = async (page: Page) => {
  const button = await page.$('input[type="submit"]');
  if (button) {
    await button.click();
  }
  return button;
};