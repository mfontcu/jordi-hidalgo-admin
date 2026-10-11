import type { MessageId } from './messages';

// Types every react-intl message id, so a missing key is a compile error.
declare global {
  namespace FormatjsIntl {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface
    interface Message {
      ids: MessageId;
    }
  }
}
