Components.utils.import("resource://gre/modules/ctypes.jsm");
Components.utils.import("resource:///modules/imServices.jsm");

const ALWAYSONTOP_PREF_BRANCH = "extensions.alwaysontop.";

/* Some constants used with the Windows API. */
const HWND_TOPMOST = -1;
const HWND_NOTOPMOST = -2;

const SWP_NOSIZE = 1;
const SWP_NOMOVE = 2;

var aotUser32Lib = ctypes.open("user32");

var setWindowPos = aotUser32Lib.declare("SetWindowPos",
                                  ctypes.winapi_abi,
                                  ctypes.bool,      /* return type */
                                  ctypes.uint32_t,  /* HWND hWnd */
                                  ctypes.int32_t,   /* HWND hWndInsertAfter */
                                  ctypes.int32_t,   /* int x */
                                  ctypes.int32_t,   /* int y */
                                  ctypes.int32_t,   /* int cx */
                                  ctypes.int32_t,   /* int cy */
                                  ctypes.uint32_t   /* UINT uFlags */
                                 );

var getActiveWindow = aotUser32Lib.declare("GetActiveWindow",
                                     ctypes.winapi_abi,
                                     ctypes.uint32_t /* return type HWND */
                                    );

var aot = {
  prefs: {},

  setFromMenu: function () {
    aot.setWindowToTop(document.getElementById("alwaysontop-menuitem")
                               .getAttribute("checked") == "true");
  },

  setWindowToTop: function (flag) {
    // Make sure the contact list is focused. This is usually no problem since we 
    //  only invoke this method when the contact list window is active anyways.
    //  It's just a safeguard, since we're going to use user32.dll:GetActiveWindow().
    let blistWin = Services.wm.getMostRecentWindow("Messenger:blist");
    if (blistWin)
      blistWin.focus()
    else
      return;

    try {
      // Get active contact list window
      let hWnd = getActiveWindow();
      setWindowPos(hWnd, flag === true ? HWND_TOPMOST : HWND_NOTOPMOST , 0 ,0 ,0 , 0, SWP_NOSIZE | SWP_NOMOVE);

      // Update saved status
      aot.prefs.setBoolPref("lastsessionontop", flag === true);
    } catch (ex) {
      Components.utils.reportError(ex);
    }
  },

  load: function() {
    // Get and apply saved status
    aot.prefs = Services.prefs.getBranch(ALWAYSONTOP_PREF_BRANCH);

    if(aot.prefs.getBoolPref("persistsetting") == true &&
       aot.prefs.getBoolPref("lastsessionontop")) {
        aot.setWindowToTop(true);
        document.getElementById("alwaysontop-menuitem").setAttribute("checked", "true");
    }
    else {
        document.getElementById("alwaysontop-menuitem").setAttribute("checked", "false");
    }

    // We want to set the always on top flag after minimize/restore again
    window.addEventListener("activate", aot.setFromMenu, false);
  }
};

this.addEventListener("load", aot.load, false);

