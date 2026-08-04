import { RichText, RichTextField } from '@sitecore-jss/sitecore-jss-react';

interface ExamPurchasedCardProps {
  message: RichTextField;
}

const ExamPurchasedCard = ({ message }: ExamPurchasedCardProps) => {
  return (
    <div className="flex justify-center w-full bg-gray-10 mb-5 px-6 py-6 md:py-10">
      <RichText
        className="flex flex-col text-center gap-3 text-gray-90 exam-purchased-message-card"
        field={message}
      />
    </div>
  );
};

export default ExamPurchasedCard;
