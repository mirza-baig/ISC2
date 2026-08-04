import ArticleAuthor, { ArticleAuthorProps } from './ArticleAuthor';

const ArticleAuthorList = ({ authors }: { authors: ArticleAuthorProps[] }) => {
  return (
    <section className="flex md:flex-col w-full md:max-w-192 pb-4 gap-7 overflow-x-auto md:overflow-x-hidden">
      {authors.map((author, index) => (
        <ArticleAuthor key={index} className="min-w-244 md:min-w-unset" fields={author.fields} />
      ))}
    </section>
  );
};

export default ArticleAuthorList;
