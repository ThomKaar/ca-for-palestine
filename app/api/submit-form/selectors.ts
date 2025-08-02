import { Page } from 'puppeteer';
const assignElementValue = (e: HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement | null, value: string) => {
  if (e) {
    e.value = value;
  }
  return;
};

export const getContactForm = async (page: Page) => {
  return await page.$('.e-con-inner form.ContactForm__form select');
};

export const getPrefix = async (page: Page) => {
  const select = await page.$$('.e-con-inner form.ContactForm__form select');
  const elm = Array.from(select)[0];
  await page.evaluate((el: HTMLSelectElement, value: string) => el.value = value, elm, 'Prefer not to identify');
  return elm;
};

export const getFirstName = async (page: Page, name: string) => {
  const input = await page.$$('.e-con-inner form.ContactForm__form input[type="text"]');
  const elm = Array.from(input)[0];
  await page.evaluate((el: HTMLInputElement, value: string) => el.value = value, elm, name);
  return elm;
};

export const getLastName = async (page: Page, name: string) => {
  const input = await page.$$('.e-con-inner form.ContactForm__form input[type="text"]');
  const elm = Array.from(input)[1];
  await page.evaluate(assignElementValue, elm, name);
  return elm;
};

export const getStreetAddressOne = async (page: Page, address: string) => {
  const elm = await page.$('.e-con-inner form.ContactForm__form .address_line_1 input[type="text"]');
  await page.evaluate(assignElementValue, elm, address);
  return elm;
};

export const getStreetAddressTwo = async (page: Page, address: string) => {
  const elm = await page.$('.e-con-inner form.ContactForm__form .address_line_2 input[type="text"]');
  await page.evaluate(assignElementValue, elm, address);
  return elm;
};

export const getCity = async (page: Page, city: string) => {
  const elm = await page.$('.e-con-inner form.ContactForm__form .address_city input[type="text"]');
  await page.evaluate(assignElementValue, elm, city);
  return elm;
};

export const getState = async (page: Page, state: string) => {
  const elm = await page.$('.e-con-inner form.ContactForm__form .address_state select');
  await page.evaluate(assignElementValue, elm, state);
  return elm;
};

export const getZipCode = async (page: Page, zipCode: string) => {
  const elm = await page.$('.e-con-inner form.ContactForm__form .address_zip input[type="text"]');
  await page.evaluate(assignElementValue, elm, zipCode);
  return elm;
};

export const getPhoneNumber = async (page: Page, phoneNumber: string) => {
  const input = await page.$$('.e-con-inner form.ContactForm__form input[type="text"]');
  const elm = Array.from(input)[6];
  await page.evaluate(assignElementValue, elm, phoneNumber);
  return elm;
};

export const getEmailInput = async (page: Page, email: string) => {
  const input = await page.$$('.e-con-inner form.ContactForm__form input[type="email"]');
  const elm = Array.from(input)[0];
  await page.evaluate(assignElementValue, elm, email);
  return elm;
};

export const getEmailConfirmationInput = async (page: Page, email: string) => {
  const input = await page.$$('.e-con-inner form.ContactForm__form input[type="email"]');
  const elm = Array.from(input)[1];
  await page.evaluate(assignElementValue, elm, email);
  return elm;
};

export const getSubjectInput = async (page: Page, subject: string) => {
  const input = await page.$$('.e-con-inner form.ContactForm__form input[type="text"]');
  const elm = Array.from(input)[8];
  await page.evaluate(assignElementValue, elm, subject);
  return elm;
};

export const getMessageTopic = async (page: Page) => {
  const input = await page.$$('.e-con-inner form.ContactForm__form select');
  const elm = Array.from(input)[2];
  await page.evaluate(assignElementValue, elm, 'FP');
  return elm;
};

export const getMessage = async (page: Page, message: string) => {
  const textarea = await page.$('.e-con-inner form.ContactForm__form textarea');
  await page.evaluate(assignElementValue, textarea, message);
  return textarea;
}; 