import { Item } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback } from 'react';

import { CollapseIndicatorIcon } from '../../icons';
import { Tag, TagsGroup } from '../../ui';

export interface ArticleTag extends Item {
  fields: {
    name?: {
      value: string;
    };
    hubPageUrl?: {
      value: string;
    };
  };
}

interface ArticleTagsProps {
  tags: ArticleTag[];
  isOpen: boolean;
  toggleVisibility: () => void;
}

const ArticleTags = ({ tags, isOpen, toggleVisibility }: ArticleTagsProps) => {
  const renderTag = useCallback((tag: ArticleTag) => {
    if (tag.fields.name?.value) {
      const redirectUrl = tag.fields?.hubPageUrl?.value ?? 'javascript:void(0)';

      return (
        <Tag key={tag.name} className="w-28" href={redirectUrl}>
          {tag.fields.name.value}
        </Tag>
      );
    }

    return null;
  }, []);

  return (
    <>
      <div id="topics-list" className="flex items-center hidden md:flex space-x-4">
        <label className="body-m text-black-100">Tags: </label>
        {tags.slice(0, 3).map(renderTag)}
        {tags.length > 3 && (
          <TagsGroup
            isOpen={isOpen}
            toggleVisibility={toggleVisibility}
            openText={`+${tags.length - 3}`}
            closeText={`+${tags.length - 3}`}
            OpenIcon={CollapseIndicatorIcon}
            items={tags.slice(3)}
            renderItem={renderTag}
          />
        )}
      </div>

      <div className="flex items-center flex md:hidden">
        <TagsGroup
          isOpen={isOpen}
          toggleVisibility={toggleVisibility}
          openText="Tags"
          closeText="Tags"
          OpenIcon={CollapseIndicatorIcon}
          listClassName="grid grid-cols-2 gap-x-5 gap-y-2.5 !space-y-0"
          items={tags}
          renderItem={renderTag}
        />
      </div>
    </>
  );
};

export default ArticleTags;
