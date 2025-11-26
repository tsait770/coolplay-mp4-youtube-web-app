/**
 * CustomEvent Polyfill for React Native/Hermes environment.
 * Fixes: ReferenceError: Property 'CustomEvent' doesn't exist
 */
(function () {
  if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') return;

  function CustomEvent (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  // Check if we are in a React Native environment where 'document' might not exist
  if (typeof document === 'undefined') {
    // Fallback for environments without a DOM (like pure React Native/Hermes)
    // We can't use the standard DOM API, so we'll create a simple object that mimics the interface.
    // This is a common pattern in RN/Expo to satisfy libraries that expect a global CustomEvent.
    // Note: This simple implementation might not fully support all DOM event dispatching features,
    // but it should satisfy the check for 'typeof CustomEvent === "function"'.
    function CustomEventRN(type, eventInitDict) {
      this.type = type;
      this.bubbles = eventInitDict && eventInitDict.bubbles !== undefined ? eventInitDict.bubbles : false;
      this.cancelable = eventInitDict && eventInitDict.cancelable !== undefined ? eventInitDict.cancelable : false;
      this.detail = eventInitDict && eventInitDict.detail !== undefined ? eventInitDict.detail : null;
    }
    CustomEventRN.prototype = Object.create(Event.prototype); // Assuming 'Event' exists or is also polyfilled if needed
    CustomEventRN.prototype.constructor = CustomEventRN;
    
    if (typeof global !== 'undefined') {
      global.CustomEvent = CustomEventRN;
    } else if (typeof self !== 'undefined') {
      self.CustomEvent = CustomEventRN;
    }
  } else {
    // Standard browser environment polyfill
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
  }
})();
