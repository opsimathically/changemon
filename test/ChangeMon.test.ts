import test from 'node:test';
import assert from 'node:assert';
import ChangeMon from '@src/classes/ChangeMon.class';
import applyChange from '@src/functions/applyChange';

(async function () {
  test('Create and test watched object.', async function () {
    type extra_data_t = {
      some_passthrough_data: number;
    };
    const changemon = new ChangeMon<extra_data_t>({
      some_passthrough_data: 15
    });

    type some_watched_type_t = {
      a_number_here: number;
      something_else: {
        [key: string]: string;
      };
      an_array: number[];
      boolean_val: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      some_arbitrary_data?: any;
    };

    const some_proxied_data = {
      a_number_here: 15,
      something_else: {
        hello: 'hi'
      },
      an_array: [1, 2, 3],
      boolean_val: true
    };

    // this is an untyped object that will be used to test
    // the working state of applyChange.  It is intentionally
    // untyped just to ennsure things work with any arbitrary
    // object.
    const some_unproxied_data = {
      a_number_here: -1
    };

    const watched_obj = changemon.watch<some_watched_type_t>(
      some_proxied_data,
      (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        old_value: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new_value: any,
        path: { path: string | number | symbol; type: string }[],
        changemon_ref: ChangeMon<extra_data_t>
      ) => {
        if (changemon_ref.extra.some_passthrough_data !== 15)
          assert.fail('Extra passthrough data was not set correctly.');
        applyChange(some_unproxied_data, path, new_value);
      }
    );

    watched_obj.an_array.push(500);
    watched_obj.a_number_here = 101;
    watched_obj.some_arbitrary_data = {
      nested: {
        data: {
          assignment: 'test_val'
        }
      }
    };

    // test deletion
    delete watched_obj.some_arbitrary_data;
    const original_object = changemon.unwatch<some_watched_type_t>(watched_obj);

    await test('Values correct after unproxying.', () => {
      if (some_unproxied_data?.a_number_here !== 101)
        assert.fail(
          'Unproxied data should be 101 due to applyChange applying that change, but it was not'
        );
    });

    await test('Object deleted ok.', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (some_unproxied_data?.some_arbitrary_data !== undefined)
        assert.fail(
          'Unproxied data should be 101 due to applyChange applying that change, but it was not'
        );
    });

    await test('Unproxied object and unwatched object are identical after unwatching.', () => {
      if (original_object !== some_proxied_data)
        assert.fail('Unwatch did not return the original  unproxied object');
    });

    console.log('Displaying Object Changes:');
    console.log({ original_object: original_object });
    console.log({ some_unproxied_data: some_unproxied_data });
    console.log(
      `Note: The object "some_unproxied_data" shown above, should have 3 empty items in its array, as our test push operation 
      only adds in a 4th value.  This outcome is intentional.`
    );
  });
})();
