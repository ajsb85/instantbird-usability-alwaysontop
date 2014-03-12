/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the "Always on Top" Instantbird add-on, released 2011.
 *
 * The Initial Developer of the Original Code is
 * Benedikt PFEIFER <benediktp@ymail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

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

