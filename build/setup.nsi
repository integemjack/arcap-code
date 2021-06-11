!define PRODUCT_NAME "Integem iPlayer"
!define PRODUCT_VERSION "3.8.178"
!define PRODUCT_PUBLISHER "Integem, Inc."
!define PRODUCT_WEB_SITE "http://www.integem.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\arcap.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKCU"
!define PRODUCT_STARTMENU_REGVAL "NSIS:StartMenuDir"

SetCompressor lzma

!define MULTIUSER_EXECUTIONLEVEL Standard
!include MultiUser.nsh

!include "MUI.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "..\static\favicon.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE ".\licence.txt"
!insertmacro MUI_PAGE_DIRECTORY
var ICONS_GROUP
!define MUI_STARTMENUPAGE_NODISABLE
!define MUI_STARTMENUPAGE_DEFAULTFOLDER "Integem iPlayer"
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "${PRODUCT_UNINST_ROOT_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "${PRODUCT_UNINST_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "${PRODUCT_STARTMENU_REGVAL}"
!insertmacro MUI_PAGE_STARTMENU Application $ICONS_GROUP
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Setup.exe"
InstallDir "$LOCALAPPDATA\Integem iPlayer"
InstallDirRegKey HKCU "${PRODUCT_UNINST_KEY}" "UninstallString"
ShowInstDetails show
ShowUninstDetails show
BrandingText " "

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on
  File /r ".\out\*.*"
  AccessControl::GrantOnFile "$INSTDIR\logs" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\data" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\libs\mailer\templates\photo.txt" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\libs\mailer\templates\video.txt" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\command" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\chrome-user-data" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\config.json" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\models" "(BU)" "FullAccess"

  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  CreateDirectory "$SMPROGRAMS\$ICONS_GROUP"
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\Integem iPlayer.lnk" "$INSTDIR\arcap.exe" "open" "$INSTDIR\Iplayer.ico"
  CreateShortCut "$DESKTOP\Integem iPlayer.lnk" "$INSTDIR\arcap.exe" "open" "$INSTDIR\Iplayer.ico"
  !insertmacro MUI_STARTMENU_WRITE_END
SectionEnd

Section -AdditionalIcons
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  WriteIniStr "$INSTDIR\${PRODUCT_NAME}.url" "InternetShortcut" "URL" "${PRODUCT_WEB_SITE}"
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\Website.lnk" "$INSTDIR\${PRODUCT_NAME}.url"
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\Uninstall.lnk" "$INSTDIR\uninst.exe"
  !insertmacro MUI_STARTMENU_WRITE_END
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\arcap.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\Iplayer.ico"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Section Uninstall
  !insertmacro MUI_STARTMENU_GETFOLDER "Application" $ICONS_GROUP
  Delete "$INSTDIR\${PRODUCT_NAME}.url"
  Delete "$INSTDIR\arcap.exe"

  Delete "$SMPROGRAMS\$ICONS_GROUP\Uninstall.lnk"
  Delete "$SMPROGRAMS\$ICONS_GROUP\Website.lnk"
  Delete "$DESKTOP\Integem iPlayer.lnk"
  Delete "$SMPROGRAMS\$ICONS_GROUP\Integem iPlayer.lnk"

  Delete "$INSTDIR\uninst.exe"

  RMDir "$SMPROGRAMS\$ICONS_GROUP"

  RMDir /r "$INSTDIR\command"
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\libs"
  RMDir /r "$INSTDIR\exe"
  RMDir /r "$INSTDIR\data"
  RMDir /r "$INSTDIR\node_modules"
  RMDir /r "$INSTDIR\chrome-user-data"
  RMDir /r "$INSTDIR\config.json"
  RMDir /r "$INSTDIR\models"

  Delete "$INSTDIR\*.*"

  RMDir /r "$INSTDIR"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKCU "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd

Function .onInit
	!insertmacro MULTIUSER_INIT
FunctionEnd

Function un.onInit
  !insertmacro MULTIUSER_UNINIT
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all its components?" IDYES +2
  Abort
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) has been successfully removed from your computer."
FunctionEnd
