import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const errors=[];
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8000/careers/');
 await page.locator('.role-row').last().waitFor();
 assert.equal(await page.locator('.role-row').count(),12);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Careers overflows');
 await page.screenshot({path:`/tmp/antvx-careers-${viewport.width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Creative',exact:true}).click();
 assert.equal(await page.locator('.role-row').count(),4);
 await page.getByRole('button',{name:'View role'}).first().click();
 await page.getByRole('dialog').waitFor();
 assert.equal(await page.locator('#application-form').isVisible(),false);
 await page.getByRole('button',{name:'Close application'}).click();
 await page.goto('http://localhost:8000/team/');
 assert.equal(await page.locator('#team-login').isDisabled(),true);
 assert.equal(await page.locator('#portal').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Team overflows');
 await page.screenshot({path:`/tmp/antvx-team-${viewport.width}.png`,fullPage:true});
 await page.goto('http://localhost:8000/');
 assert.equal(await page.getByRole('link',{name:'Careers',exact:true}).count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Home overflows');
 await page.close();
}
assert.deepEqual(errors,[]);await browser.close();console.log('Desktop/mobile layouts, filters, closed-role dialog, portal setup state, and navigation passed.');
