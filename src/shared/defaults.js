/**
 * Default starter categories and configuration for QuickLeague v1.0
 */

const DEFAULT_CONFIG = {
  appName: 'QuickLeague',
  version: '1.0.0',
  hudMode: 'corner', // 'corner' | 'radial'
  soundEnabled: true,
  autoDismissSeconds: 3,
  categories: [
    {
      id: 'cat_whiffs',
      name: 'Teammate Whiffs',
      channel: 'team', // 'team' (Y) or 'all' (T)
      hotkey: 'Numpad1',
      slots: [
        { slot: 1, text: 'Nice block! (Wait, which net was that?)' },
        { slot: 2, text: 'Passing! ...To the other team apparently.' },
        { slot: 3, text: 'Take the shot! I promise the ball does not bite.' },
        { slot: 4, text: 'Need boost (and glasses).' },
        { slot: 5, text: 'Defending... from the parking lot.' },
        { slot: 6, text: 'Calculated whiff.' },
        { slot: 7, text: 'Great clearance for them!' },
        { slot: 8, text: 'Faking!' },
        { slot: 9, text: 'Rotating into oblivion.' }
      ],
      randomPool: [
        'Calculated.',
        'Faking.',
        'Okay.',
        'Need boost (and glasses).',
        'What a save!',
        'Close one!'
      ]
    },
    {
      id: 'cat_mistakes',
      name: 'My Mistakes',
      channel: 'all',
      hotkey: 'Numpad2',
      slots: [
        { slot: 1, text: 'My bad, controller disconnected (in my brain).' },
        { slot: 2, text: 'Faking! Definitely intentional.' },
        { slot: 3, text: 'Sorry! My dog jumped on the keyboard.' },
        { slot: 4, text: 'Lag spike, I swear.' },
        { slot: 5, text: 'Calculated... just bad math.' },
        { slot: 6, text: 'Whoops!' },
        { slot: 7, text: 'My boost ran out of emotional support.' },
        { slot: 8, text: 'Great pass, terrible finish.' },
        { slot: 9, text: 'I promise I know which net is ours.' }
      ],
      randomPool: [
        'My bad...',
        'Whoops...',
        'Sorry!',
        'Calculated.',
        'Faking.'
      ]
    },
    {
      id: 'cat_opponents',
      name: 'Opponent Banter',
      channel: 'all',
      hotkey: 'Numpad3',
      slots: [
        { slot: 1, text: 'Nice demo! Very personal.' },
        { slot: 2, text: 'What a save!' },
        { slot: 3, text: 'Is your camera setting zoomed into the ceiling?' },
        { slot: 4, text: 'Nice shot! (Hit the post next time)' },
        { slot: 5, text: 'Thanks for the assist!' },
        { slot: 6, text: 'Whew.' },
        { slot: 7, text: 'Good bump, better recovery.' },
        { slot: 8, text: 'Close one!' },
        { slot: 9, text: 'Rematch after this?' }
      ],
      randomPool: [
        'What a save!',
        'Nice demo!',
        'Close one!',
        'Whew.',
        'Okay.'
      ]
    },
    {
      id: 'cat_compliments',
      name: 'Compliments & GG',
      channel: 'all',
      hotkey: 'Numpad4',
      slots: [
        { slot: 1, text: 'Great pass! Clean read.' },
        { slot: 2, text: 'Nice shot! Absolutely clinical.' },
        { slot: 3, text: 'What a save! Huge clutch.' },
        { slot: 4, text: 'Good game everyone, well played!' },
        { slot: 5, text: 'Teamwork makes the dream work.' },
        { slot: 6, text: 'Insane 50/50 win!' },
        { slot: 7, text: 'That aerial was beautiful.' },
        { slot: 8, text: 'No problem!' },
        { slot: 9, text: 'GG WP!' }
      ],
      randomPool: [
        'Great pass!',
        'Nice shot!',
        'What a save!',
        'GG WP!',
        'No problem!'
      ]
    }
  ]
};

module.exports = {
  DEFAULT_CONFIG
};
