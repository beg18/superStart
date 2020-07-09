import $ from './lib/lib';
import u1Modals from './lib/practica/u1-modals';
import u1Tabs from './lib/practica/u1-tabs';
import readMore from './lib/practica/test';
import sliders from './lib/components/sliders';
import u1CangeModalState from './lib/practica/u1-changeModalState';
import u1Timer from './lib/practica/u1-timer';
import u1Popimages from './lib/practica/u1-popimages';

window.addEventListener('DOMContentLoaded', () => {
    "use strict";
    u1Modals();
    readMore();
    u1Tabs('.test__list', '.test__link', '.tab-content__item', 'test__link--active');
    sliders('.adv__element', 'vertical');

    let deadline = '2020- 07- 15';
    u1Timer('.container1', deadline);
    u1Popimages();
});