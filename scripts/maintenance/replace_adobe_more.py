import re

filepath = 'src/pages/AdobeAlternativePage.tsx'
with open(filepath, 'r') as f:
    content = f.read()

replacements = {
    "t('auto.span_back_to_all_33', { defaultValue: `Back to All PDF Tools` })": "t('adobeAlternative.backToTools', { defaultValue: 'Back to All PDF Tools' })",
    "t('auto.span_free_adobe_acrobat_988', { defaultValue: `Free Adobe Acrobat Alternative` })": "t('adobeAlternative.alternativeSubtitle', { defaultValue: 'Free Adobe Acrobat Alternative' })",
    "t('auto.span_start_with_any_415', { defaultValue: `Start with any tool` })": "t('adobeAlternative.startWithAnyTool', { defaultValue: 'Start with any tool' })",
    "t('auto.span_no_account_required_877', { defaultValue: `No account required` })": "t('adobeAlternative.noAccount', { defaultValue: 'No account required' })",
    "t('auto.span_no_file_uploads_938', { defaultValue: `No file uploads` })": "t('adobeAlternative.noUploads', { defaultValue: 'No file uploads' })",
    "t('auto.span_no_watermarks_148', { defaultValue: `No watermarks` })": "t('adobeAlternative.noWatermarks', { defaultValue: 'No watermarks' })",
    "t('auto.span_no_subscription_607', { defaultValue: `No subscription` })": "t('adobeAlternative.noSubscription', { defaultValue: 'No subscription' })",
    "t('auto.h2_why_people_are_546', { defaultValue: `Why people are switching right now` })": "t('adobeAlternative.whySwitching', { defaultValue: 'Why people are switching right now' })",
    "t('auto.h2_pick_your_task_652', { defaultValue: `Pick your task` })": "t('adobeAlternative.pickTask', { defaultValue: 'Pick your task' })",
    "t('auto.h4_adobe_acrobat_foxit_751', { defaultValue: `Adobe Acrobat, Foxit, Nitro` })": "t('adobeAlternative.competitorDesktop', { defaultValue: 'Adobe Acrobat, Foxit, Nitro' })",
    "t('auto.h4_smallpdf_ilovepdf_soda_869', { defaultValue: `Smallpdf, iLovePDF, Soda` })": "t('adobeAlternative.competitorWeb', { defaultValue: 'Smallpdf, iLovePDF, Soda' })"
}

for old, new_str in replacements.items():
    content = content.replace(old, new_str)

with open(filepath, 'w') as f:
    f.write(content)
print("Updated AdobeAlternativePage.tsx more keys")
