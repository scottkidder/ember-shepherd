import { module, test } from 'qunit';
import { visit, click, find } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { builtInButtons, steps as defaultSteps } from '../data';

const toggleTour = async (tour, modal) => {
  tour.set('modal', modal);
  tour.addSteps(defaultSteps);
  return await tour.start();
};

module('Acceptance | Tour functionality tests', function(hooks) {
  let tour;

  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    tour = this.owner.lookup('service:tour');

    tour.set('confirmCancel', false);
    tour.set('modal', true);
  });

  hooks.afterEach(async function() {
    return await tour.complete();
  });

  module('Cancel link', function() {
    test('Shows cancel link', async function(assert) {
      await visit('/');

      await toggleTour(tour, true);

      const cancelLink = document.querySelector('.shepherd-cancel-link');
      assert.ok(cancelLink, 'Cancel link shown');
    });

    test('Hides cancel link', async function(assert) {
      const defaultStepOptions = {
        classes: 'shepherd-theme-arrows test-defaults',
        showCancelLink: false
      };

      const steps = [{
        id: 'step-without-cancel-link',
        options: {
          attachTo: '.first-element bottom',
          buttons: [
            builtInButtons.cancel,
            builtInButtons.next
          ],
          showCancelLink: false
        }
      }];

      await visit('/');

      tour.set('defaultStepOptions', defaultStepOptions);
      tour.addSteps(steps);

      tour.start();

      assert.notOk(document.querySelector('.shepherd-element a.shepherd-cancel-link'));
    });

    test('Cancel link cancels the tour', async function(assert) {
      await visit('/');

      await toggleTour(tour, true);

      assert.ok(document.body.classList.contains('shepherd-active'), 'Body has class of shepherd-active, when shepherd becomes active');

      await click(document.querySelector('.shepherd-content a.shepherd-cancel-link'));

      assert.notOk(document.body.classList.contains('shepherd-active'), 'Body does not have class of shepherd-active, when shepherd becomes inactive');
    });
  });

  module('Required Elements', function() {
    test('Not warning about required elements when none are specified', async function(assert) {
      await visit('/');

      await toggleTour(tour, true);

      const currentStepId = document.body.getAttribute('data-shepherd-step');

      assert.equal(currentStepId, defaultSteps[0].id);
    });


    test('Not warning about required elements when none are missing', async function(assert) {
      const requiredElements = [
        {
          selector: 'body',
          message: 'Body element not found 🤔',
          title: 'Error'
        }
      ];

      tour.set('requiredElements', requiredElements);

      await visit('/');

      await toggleTour(tour, true);

      const currentStepId = document.body.getAttribute('data-shepherd-step');

      assert.equal(currentStepId, defaultSteps[0].id);
    });


    test('Warning about missing required elements when all are present', async function(assert) {
      const requiredElements = [
        {
          selector: '👻',
          message: '👻 element not found',
          title: 'Missing Required Elements'
        }
      ];

      tour.set('requiredElements', requiredElements);

      await visit('/');

      await toggleTour(tour, true);

      const currentStepId = document.body.getAttribute('data-shepherd-step');

      assert.equal(currentStepId, 'error');
    });
  });

  module('Tour options', function() {
    test('Defaults applied', async function(assert) {
      assert.expect(1);

      const stepsWithoutClasses = [
        {
          id: 'test-highlight',
          options: {
            attachTo: '.first-element bottom',
            buttons: [
              builtInButtons.cancel,
              builtInButtons.next
            ]
          }
        }
      ];

      await visit('/');

      tour.addSteps(stepsWithoutClasses);

      tour.start();

      assert.ok(document.querySelector('.custom-default-class'), 'defaults class applied');
    });

    test('configuration works with attachTo object when element is a simple string', async function(assert) {
      assert.expect(1);

      const steps = [{
        id: 'test-attachTo-string',
        options: {
          attachTo: {
            element: '.first-element',
            on: 'bottom'
          },
          buttons: [
            builtInButtons.cancel,
            builtInButtons.next
          ]
        }
      }];

      tour.addSteps(steps);

      await visit('/');

      tour.start();

      assert.ok(document.querySelector('.shepherd-element'), 'tour is visible');
    });

    test('configuration works with attachTo object when element is dom element', async function(assert) {
      assert.expect(1);

      await visit('/');

      const steps = [{
        id: 'test-attachTo-dom',
        options: {
          attachTo: {
            element: find('.first-element'),
            on: 'bottom'
          },
          buttons: [
            builtInButtons.cancel,
            builtInButtons.next
          ]
        }
      }];

      tour.addSteps(steps);
      tour.start();

      assert.ok(document.querySelector('.shepherd-element'), 'tour is visible');
    });

    test('buttons work when type is not specified and passed action is triggered', async function(assert) {
      assert.expect(4);

      let buttonActionCalled = false;

      const steps = [{
        id: 'test-buttons-custom-action',
        options: {
          attachTo: {
            element: '.first-element',
            on: 'bottom'
          },
          buttons: [
            {
              classes: 'shepherd-button-secondary button-one',
              text: 'button one'
            },
            {
              classes: 'shepherd-button-secondary button-two',
              text: 'button two',
              action() {
                buttonActionCalled = true;
              }
            },
            {
              classes: 'shepherd-button-secondary button-three',
              text: 'button three'
            }
          ]
        }
      }];

      await visit('/');

      tour.addSteps(steps);

      await tour.start();

      assert.ok(document.querySelector('.button-one'), 'tour button one is visible');
      assert.ok(document.querySelector('.button-two'), 'tour button two is visible');
      assert.ok(document.querySelector('.button-three'), 'tour button three is visible');

      await click(document.querySelector('.button-two'));

      assert.ok(buttonActionCalled, 'button action triggered');
    });

    test('scrollTo works with disableScroll on', async function(assert) {
      assert.expect(2);
      // Setup controller tour settings
      tour.set('disableScroll', true);
      tour.set('scrollTo', true);

      // Visit route
      await visit('/');

      document.querySelector('#ember-testing-container').scrollTop = 0;

      assert.equal(document.querySelector('#ember-testing-container').scrollTop, 0, 'Scroll is initially 0');

      await tour.start();

      await click(document.querySelector('.shepherd-content .next-button'));

      await click(document.querySelector('.shepherd-content .next-button'));

      assert.ok(document.querySelector('#ember-testing-container').scrollTop > 0, 'Scrolled down correctly');
    });

    test('scrollTo works with a custom scrollToHandler', async function(assert) {
      assert.expect(2);

      const done = assert.async();

      // Override default behavior
      const steps = [{
        id: 'intro',
        options: {
          attachTo: '.first-element bottom',
          buttons: [
            builtInButtons.cancel,
            builtInButtons.next
          ],
          scrollTo: true,
          scrollToHandler() {
            document.querySelector('#ember-testing-container').scrollTop = 120;
            assert.equal(document.querySelector('#ember-testing-container').scrollTop, 120, 'Scrolled correctly');
            done();
          }
        }
      }];

      // Visit route
      await visit('/');

      tour.addSteps(steps);

      document.querySelector('#ember-testing-container').scrollTop = 0;
      assert.equal(document.querySelector('#ember-testing-container').scrollTop, 0, 'Scroll is initially 0');

      await tour.start();
      await click(document.querySelector('.shepherd-content .next-button'));
    });

    test('scrollTo works without a custom scrollToHandler', async function(assert) {
      assert.expect(2);
      // Setup controller tour settings
      tour.set('scrollTo', true);

      // Visit route
      await visit('/');

      document.querySelector('#ember-testing-container').scrollTop = 0;

      assert.equal(document.querySelector('#ember-testing-container').scrollTop, 0, 'Scroll is initially 0');

      await tour.start();

      await click(document.querySelector('.shepherd-content .next-button'));

      assert.ok(document.querySelector('#ember-testing-container').scrollTop > 0, 'Scrolled correctly');
    });

    test('Show by id works', async function(assert) {
      assert.expect(1);

      await visit('/');

      tour.show('usage');

      assert.equal(tour.get('tourObject').currentStep.el.querySelector('.shepherd-text').textContent,
        'To use the tour service, simply inject it into your application and use it like this example.',
        'Usage step shown');
    });

    test('hide method hides the current step', async function(assert) {
      assert.expect(1);

      await visit('/');

      tour.show('usage');
      tour.hide();

      assert.equal(tour.get('tourObject').currentStep.isOpen(), false, 'The step is hidden');
    });
  });
});
