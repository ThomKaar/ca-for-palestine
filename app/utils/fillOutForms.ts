import type { EmailContent, UserInfo } from '../types/main.ts';
import { 
  getPrefix, 
  getFirstName,
  getLastName,
  getStreetAddressOne,
  getStreetAddressTwo,
  getCity,
  getState,
  getZipCode,
  getPhoneNumber,
  getEmailInput,
  getEmailConfirmationInput,
  getSubjectInput,
  getMessageTopic,
  getMessage,
  submitForm,
 } from './selectors';
 import {
  selectFeedback,
  getEmail as getPadillaEmail,
  getEmailConfirmation as getPadillaEmailConfirmation,
  firstName as getPadillaFirstName,
  lastName as getPadillaLastName,
  getStreetAddressOne as getPadillaStreetAddressOne,
  getStreetAddressTwo as getPadillaStreetAddressTwo,
  getCity as getPadillaCity,
  getZipCode as getPadillaZipCode,
  getPhoneNumber as getPadillaPhoneNumber,
  messageTopic as getPadillaMessageTopic,
  getMessageTextArea as getPadillaMessageTextArea,
  noUpdates as getPadillaNoUpdates,
  getSubjectInput as getPadillaSubjectInput,
 } from './padilla/selectors';
import puppeteer from 'puppeteer';



const contactSchiff = async (email: EmailContent, userInfo: UserInfo, options = { dev: true }) => {
  const { dev = true } = options;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to contact form
    await page.goto('https://www.schiff.senate.gov/contact/get-in-touch/');

    await getPrefix(page);
    await getFirstName(page, userInfo.firstName);
    await getLastName(page, userInfo.lastName);
    await getStreetAddressOne(page, userInfo.addressOne);
    await getStreetAddressTwo(page, userInfo.addressTwo);
    await getCity(page, userInfo.city);
    await getState(page, userInfo.state);
    await getZipCode(page, userInfo.zipCode);
    await getPhoneNumber(page, userInfo.phoneNumber);
    await getEmailInput(page, userInfo.email);
    await getEmailConfirmationInput(page, userInfo.email);
    await getSubjectInput(page, email.subject);
    await getMessageTopic(page);
    await getMessage(page, email.body);
    if (!dev) {
      await submitForm(page);
    }
  } catch (e) {
    console.error('Error in contactSchiff:', e);
  } finally {
      if (!dev) {
          await browser.close();
      }
  }
};


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const contactPadilla = async (email: EmailContent, userInfo: UserInfo, options = { dev: true }) => {
  const { dev = true } = options;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to contact form
    await page.goto('https://www.padilla.senate.gov/contact/contact-form/');

    await selectFeedback(page);
    await getPadillaMessageTopic(page);
    await getPadillaFirstName(page, userInfo.firstName);
    await getPadillaLastName(page, userInfo.lastName);
    await getPadillaStreetAddressOne(page, userInfo.addressOne);
    await getPadillaStreetAddressTwo(page, userInfo.addressTwo);
    await getPadillaCity(page, userInfo.city);
    await getPadillaZipCode(page, userInfo.zipCode);
    await getPadillaPhoneNumber(page, userInfo.phoneNumber);
    await getPadillaEmail(page, userInfo.email);
    await getPadillaEmailConfirmation(page, userInfo.email);
    await getPadillaSubjectInput(page, email.subject);
    await selectFeedback(page);
    await getPadillaMessageTextArea(page, email.body);
    await getPadillaNoUpdates(page);

    if (!dev) {
      await submitForm(page);
    }
  } catch (e) {
    console.error('Error in contactSchiff:', e);
  } finally {
      if (!dev) {
          await browser.close();
      }
  }
};

export { contactSchiff, contactPadilla };