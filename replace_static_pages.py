import re

def update_file(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        for old, new_str in replacements.items():
            content = content.replace(old, new_str)
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
    except FileNotFoundError:
        print(f"File not found: {filepath}")

adobe_replacements = {
    "t('auto.h4_pdfminty_117', { defaultValue: `PDFMinty` })": "t('adobeAlternative.pdfmintyLabel', { defaultValue: 'PDFMinty' })",
    "t('auto.h3_when_is_acrobat_494', { defaultValue: `When Is Acrobat Still Necessary?` })": "t('adobeAlternative.whenAcrobatNeeded', { defaultValue: 'When Is Acrobat Still Necessary?' })",
    "t('auto.h2_frequently_asked_questions_828', { defaultValue: `Frequently Asked Questions` })": "t('adobeAlternative.faqTitle', { defaultValue: 'Frequently Asked Questions' })",
    "t('auto.p_everything_you_need_803', { defaultValue: `Everything you need to know about switching from Adobe Acrobat to PDFMinty` })": "t('adobeAlternative.faqDesc', { defaultValue: 'Everything you need to know about switching from Adobe Acrobat to PDFMinty' })",
    "t('auto.h2_stop_paying_to_316', { defaultValue: `Stop paying to move pages around.` })": "t('adobeAlternative.stopPayingTitle', { defaultValue: 'Stop paying to move pages around.' })",
    "t('auto.p_every_tool_no_884', { defaultValue: `Every tool. No account. No upload. No cost.` })": "t('adobeAlternative.everyToolDesc', { defaultValue: 'Every tool. No account. No upload. No cost.' })"
}

aboutus_replacements = {
    "t('auto.span_zero_uploads_zero_382', { defaultValue: `Zero Uploads. Zero Compromise.` })": "t('aboutUs.zeroUploads', { defaultValue: 'Zero Uploads. Zero Compromise.' })",
    "t('auto.h2_the_traditional_problem_831', { defaultValue: `The Traditional Problem` })": "t('aboutUs.traditionalProblem', { defaultValue: 'The Traditional Problem' })",
    "t('auto.h2_the_pdfminty_solution_295', { defaultValue: `The PdfMinty Solution` })": "t('aboutUs.pdfmintySolution', { defaultValue: 'The PdfMinty Solution' })",
    "t('auto.h2_our_core_values_864', { defaultValue: `Our Core Values` })": "t('aboutUs.coreValues', { defaultValue: 'Our Core Values' })",
    "t('auto.p_every_design_decision_255', { defaultValue: `Every design decision at PdfMinty is guided by three non-negotiable promises.` })": "t('aboutUs.designDecision', { defaultValue: 'Every design decision at PdfMinty is guided by three non-negotiable promises.' })",
    "t('auto.h3_inbrowser_privacy_76', { defaultValue: `In-Browser Privacy` })": "t('aboutUs.inBrowserPrivacy', { defaultValue: 'In-Browser Privacy' })",
    "t('auto.p_standard_pdf_tools_820', { defaultValue: `Standard PDF tools process files directly in your browser memory on your local device.` })": "t('aboutUs.standardToolsPrivacy', { defaultValue: 'Standard PDF tools process files directly in your browser memory on your local device.' })",
    "t('auto.h3_fast_local_execution_770', { defaultValue: `Fast Local Execution` })": "t('aboutUs.fastExecution', { defaultValue: 'Fast Local Execution' })",
    "t('auto.p_no_waiting_for_191', { defaultValue: `No waiting for uploads or downloads. Processing happens instantly on your device.` })": "t('aboutUs.noWaiting', { defaultValue: 'No waiting for uploads or downloads. Processing happens instantly on your device.' })",
    "t('auto.p_no_signups_paywalls_831', { defaultValue: `No signups, paywalls, or hidden watermarks. Professional PDF tools for everyone.` })": "t('aboutUs.freeForever', { defaultValue: 'No signups, paywalls, or hidden watermarks. Professional PDF tools for everyone.' })",
    "t('auto.h2_built_for_everyone_606', { defaultValue: `Built for Everyone` })": "t('aboutUs.builtForEveryone', { defaultValue: 'Built for Everyone' })",
    "t('auto.p_pdfminty_is_designed_11', { defaultValue: `PdfMinty is designed from the ground up to be accessible, fast, and easy to use for all visitors.` })": "t('aboutUs.accessibleDesc', { defaultValue: 'PdfMinty is designed from the ground up to be accessible, fast, and easy to use for all visitors.' })",
    "t('auto.span_skip_navigation_links_253', { defaultValue: `Skip Navigation Links for Efficiency` })": "t('aboutUs.skipLinks', { defaultValue: 'Skip Navigation Links for Efficiency' })",
    "t('auto.h2_ready_to_experience_20', { defaultValue: `Ready to experience private PDF processing?` })": "t('aboutUs.readyToExperience', { defaultValue: 'Ready to experience private PDF processing?' })",
    "t('auto.span_explore_all_pdf_749', { defaultValue: `Explore All PDF Tools` })": "t('aboutUs.exploreTools', { defaultValue: 'Explore All PDF Tools' })"
}

privacy_replacements = {
    "t('auto.h1_privacy_policy_719', { defaultValue: `Privacy Policy` })": "t('privacyPolicy.title', { defaultValue: 'Privacy Policy' })",
    "t('auto.h2_the_short_version_502', { defaultValue: `The Short Version` })": "t('privacyPolicy.shortVersion', { defaultValue: 'The Short Version' })"
}

contact_replacements = {
    "t('auto.span_were_here_to_717', { defaultValue: `We're Here to Help` })": "t('contact.hereToHelp', { defaultValue: 'We\\'re Here to Help' })",
    "t('auto.h1_contact_us_909', { defaultValue: `Contact Us` })": "t('contact.title', { defaultValue: 'Contact Us' })",
    "t('auto.h2_direct_email_405', { defaultValue: `Direct Email` })": "t('contact.directEmail', { defaultValue: 'Direct Email' })",
    "t('auto.p_send_us_your_686', { defaultValue: `Send us your thoughts anytime` })": "t('contact.sendThoughts', { defaultValue: 'Send us your thoughts anytime' })",
    "t('auto.h2_response_time_618', { defaultValue: `Response Time` })": "t('contact.responseTime', { defaultValue: 'Response Time' })",
    "t('auto.p_we_reply_as_648', { defaultValue: `We reply as fast as possible` })": "t('contact.replyFast', { defaultValue: 'We reply as fast as possible' })",
    "t('auto.h2_privacy_guaranteed_289', { defaultValue: `Privacy Guaranteed` })": "t('contact.privacyGuaranteed', { defaultValue: 'Privacy Guaranteed' })",
    "t('auto.span_zero_cloud_uploads_809', { defaultValue: `Zero Cloud Uploads` })": "t('contact.zeroUploadsBadge', { defaultValue: 'Zero Cloud Uploads' })",
    "t('auto.h3_message_received_538', { defaultValue: `Message Received!` })": "t('contact.messageReceived', { defaultValue: 'Message Received!' })",
    "t('auto.span_sending_209', { defaultValue: `Sending...` })": "t('contact.sending', { defaultValue: 'Sending...' })",
    "t('auto.span_send_message_675', { defaultValue: `Send Message` })": "t('contact.sendMessage', { defaultValue: 'Send Message' })"
}

tos_replacements = {
    "t('auto.h1_terms_of_service_61', { defaultValue: `Terms of Service` })": "t('termsOfService.title', { defaultValue: 'Terms of Service' })"
}

issafe_replacements = {
    "t('auto.span_back_to_all_75', { defaultValue: `Back to All PDF Tools` })": "t('isSafePdf.backToTools', { defaultValue: 'Back to All PDF Tools' })",
    "t('auto.span_document_security_analysis_478', { defaultValue: `Document Security Analysis` })": "t('isSafePdf.securityAnalysis', { defaultValue: 'Document Security Analysis' })",
    "t('auto.h1_are_online_pdf_996', { defaultValue: `Are Online PDF Converters Safe? The Privacy Hazards Explained` })": "t('isSafePdf.title', { defaultValue: 'Are Online PDF Converters Safe? The Privacy Hazards Explained' })",
    "t('auto.h2_what_happens_when_189', { defaultValue: `What Happens When You Upload a PDF to the Cloud?` })": "t('isSafePdf.whatHappens', { defaultValue: 'What Happens When You Upload a PDF to the Cloud?' })",
    "t('auto.h2_keep_your_sensitive_829', { defaultValue: `Keep your sensitive documents safe.` })": "t('isSafePdf.keepDocsSafe', { defaultValue: 'Keep your sensitive documents safe.' })",
    "t('auto.p_process_your_standard_560', { defaultValue: `Process your standard PDFs locally in browser memory with PDFMinty.` })": "t('isSafePdf.processLocally', { defaultValue: 'Process your standard PDFs locally in browser memory with PDFMinty.' })",
    "t('auto.span_start_using_free_477', { defaultValue: `Start Using Free Tools` })": "t('isSafePdf.startUsing', { defaultValue: 'Start Using Free Tools' })"
}

update_file('src/pages/AdobeAlternativePage.tsx', adobe_replacements)
update_file('src/pages/AboutUsPage.tsx', aboutus_replacements)
update_file('src/pages/PrivacyPolicyPage.tsx', privacy_replacements)
update_file('src/pages/ContactPage.tsx', contact_replacements)
update_file('src/pages/TermsOfServicePage.tsx', tos_replacements)
update_file('src/pages/IsSafePdfArticlePage.tsx', issafe_replacements)

