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
        pass

notfound_replacements = {
    "t('auto.h1_page_not_found_180', { defaultValue: `Page Not Found` })": "t('notFound.title', { defaultValue: 'Page Not Found' })",
    "t('auto.p_the_page_youre_732', { defaultValue: `The page you're looking for doesn't exist or has been moved. Try one of our popular PDF tools below.` })": "t('notFound.description', { defaultValue: 'The page you\\'re looking for doesn\\'t exist or has been moved. Try one of our popular PDF tools below.' })",
    "t('auto.span_back_to_home_744', { defaultValue: `Back to Home` })": "t('notFound.backToHome', { defaultValue: 'Back to Home' })",
    "t('auto.span_popular_tools_605', { defaultValue: `Popular Tools` })": "t('notFound.popularTools', { defaultValue: 'Popular Tools' })"
}

home_replacements = {
    "t('auto.h2_free_inbrowser_pdf_51', { defaultValue: `Free In-Browser PDF Tools` })": "t('homePage.srToolsHeading', { defaultValue: 'Free In-Browser PDF Tools' })"
}

blog_replacements = {
    "t('auto.h1_article_not_found_958', { defaultValue: `Article Not Found` })": "t('blogPost.notFound', { defaultValue: 'Article Not Found' })",
    "t('auto.p_the_requested_guide_545', { defaultValue: `The requested guide or article could not be located in our knowledge hub.` })": "t('blogPost.notFoundDesc', { defaultValue: 'The requested guide or article could not be located in our knowledge hub.' })"
}

update_file('src/pages/NotFoundPage.tsx', notfound_replacements)
update_file('src/pages/HomePage.tsx', home_replacements)
update_file('src/pages/BlogPostPage.tsx', blog_replacements)
