import { useEffect, useState, useRef, useCallback } from 'react';
import { useBreakpoint, useInterval } from 'hooks/index';
import clsx from 'clsx';

const InPageNavigation = () => {
  const [isHeadingExist, setIsHeadingExist] = useState<boolean>(false);
  const [hideTray, setHideTray] = useState<boolean>(false);
  const [selectedTrayItem, setSelectedTrayItem] = useState<string | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [prevTarget, setPrevTarget] = useState<HTMLElement | null>(null);
  const [inPageLinks, setInPageLinks] = useState<{ value: string; link: string; id: string }[]>([]);

  const wrapperRef = useRef(null);
  const breakpoint = useBreakpoint();

  const processHeadingSelect = useCallback(
    (
      currentTarget: HTMLElement,
      link: { value: string; link: string; id: string },
      shouldScroll = true
    ) => {
      const isLastHeading = link.id === inPageLinks[inPageLinks.length - 1].id;
      if (prevTarget) {
        prevTarget.classList.remove('bold-link');
      }

      currentTarget instanceof HTMLElement && currentTarget?.classList.add('bold-link');
      setPrevTarget(currentTarget);

      setSelectedTrayItem(link.value);
      setHideTray(false);

      let diffTop = 0;
      const curLinkTop =
        currentTarget instanceof HTMLElement ? currentTarget.getBoundingClientRect().top : 0;
      const secTopElement = document.getElementById('inpageLinks');
      const secTop = secTopElement ? secTopElement.getBoundingClientRect().top : 0;

      diffTop = Math.floor(curLinkTop - secTop) + 5;

      if (isLastHeading) {
        const progTrackerContainer = document.querySelector('.progTrackerContainer');
        diffTop = progTrackerContainer
          ? progTrackerContainer.getBoundingClientRect().height - 12
          : 0;
      }

      const progTracker = document.getElementById('progTracker');
      progTracker instanceof HTMLElement &&
        progTracker.setAttribute('style', `height:${diffTop}px`);

      const viewId = document.getElementById(link.id)?.getBoundingClientRect().top;
      const topValue = viewId && viewId - document.body.getBoundingClientRect().top - 180;

      if (shouldScroll) {
        window.scrollTo({
          behavior: 'smooth',
          top: topValue,
        });
      }
    },
    [setSelectedTrayItem, setHideTray, prevTarget, inPageLinks]
  );

  const handleScroll = useCallback(() => {
    const headingTags = document.querySelectorAll('#right-content h2, #right-content h3');
    let newActiveHeadingId = null;

    for (const heading of headingTags) {
      const { top, bottom } = heading.getBoundingClientRect();
      if (top >= 0 && bottom <= window.innerHeight) {
        newActiveHeadingId = heading.id;
        break;
      }
    }

    if (newActiveHeadingId !== activeHeadingId) {
      setActiveHeadingId(newActiveHeadingId);
    }
  }, [activeHeadingId]);

  const showLinks = useCallback(() => {
    const parent = document.querySelector('#inpageLinks');

    let initialPrevTarget = null;

    inPageLinks.forEach((link, index) => {
      const liTag = document.createElement('li');
      liTag.classList.add('py-1');

      const anchorTag = document.createElement('a');
      anchorTag.setAttribute('href', `${link.link}#${link.id}`);
      anchorTag.setAttribute('class', 'page-link');
      anchorTag.innerText = link.value;

      if (index === 0) {
        initialPrevTarget = anchorTag;
        anchorTag.classList.add('bold-link');
        setSelectedTrayItem(link.value);
      }

      anchorTag.addEventListener('click', function (event) {
        event.preventDefault();
        const currentTarget = event.currentTarget as HTMLElement;
        window.removeEventListener('scroll', handleScroll);

        if (currentTarget) {
          processHeadingSelect(currentTarget, link, true);
        }
      });

      liTag.appendChild(anchorTag);
      parent?.appendChild(liTag);
      return;
    });
    if (initialPrevTarget) {
      setPrevTarget(initialPrevTarget as HTMLElement);
    }
  }, [inPageLinks, processHeadingSelect, handleScroll]);

  useInterval(() => {
    const headingTags = document.querySelectorAll('h2, h3');
    headingTags && setIsHeadingExist(true);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (activeHeadingId) {
      const linkData = inPageLinks.find((link) => link.id === activeHeadingId);

      if (linkData) {
        const activeLink = document.querySelector(
          `a[href$="#${activeHeadingId}"]`
        ) as HTMLAnchorElement | null;

        if (activeLink) {
          processHeadingSelect(activeLink, linkData, false);
        }
      }
    }
  }, [activeHeadingId, inPageLinks, processHeadingSelect]);

  useEffect(() => {
    if (!isHeadingExist) return;
    if (document.querySelector('#inpageLinks li')) return;

    const headingTags = '#right-content h2, #right-content h3';
    const nodes = document.querySelectorAll(headingTags);
    const inPageLinks: { value: string; link: string; id: string }[] = [];

    Object.values(nodes).forEach((ele, i) => {
      const linkData = {
        value: (ele as HTMLElement).innerText,
        link: ele.baseURI,
        id: `heading-${i}`,
      };
      inPageLinks.push(linkData);
      ele.setAttribute('id', `heading-${i}`);
    });
    setInPageLinks(inPageLinks);

    if (!(document.readyState === 'loading') && inPageLinks) showLinks();
  }, [isHeadingExist, showLinks]);

  useEffect(() => {
    /** Only to run in Small Device */
    if (!isHeadingExist) return;
    if (!(breakpoint === 'sm')) return;

    document.addEventListener('mousedown', (event: MouseEvent): void => {
      if (
        wrapperRef.current &&
        !(wrapperRef.current as HTMLElement)?.contains(event.target as Node)
      ) {
        hideTray && setHideTray(false);
      }
    });
  }, [isHeadingExist, wrapperRef, breakpoint, hideTray]);

  const inNavMobileStyle =
    'flex fixed w-fit m-auto left-0 right-0 bottom-32 shadow-lg bg-gray-10 pl-4 pr-10 pt-6 pb-6';
  const inNavTabletStyle = 'md:pt-4 md:bg-inherit md:w-auto md:sticky md:top-32 md:shadow-none';

  return (
    <div
      id="inPageNav"
      className={!isHeadingExist ? 'hidden' : clsx(inNavMobileStyle, inNavTabletStyle)}
      ref={wrapperRef}
    >
      <div className={clsx(hideTray ? 'flex' : 'hidden', 'md:flex progTrackerContainer')}>
        <button
          onClick={() => setHideTray(false)}
          className="text-3xl absolute right-4 top-0 md:hidden"
        >
          &times;
        </button>
        <div className="w-1 flex flex-col flex-1 bg-slate-300 mt-1">
          <span className="bg-slate-700" id="progTracker"></span>
          <span className="bg-black rounded-full relative -left-2/4 p-1"></span>
        </div>
        <ul id="inpageLinks" className="m-0 pl-4 flex flex-col justify-center"></ul>
      </div>

      <button
        onClick={() => setHideTray(true)}
        className={clsx(hideTray ? 'hidden' : 'flex', 'md:hidden')}
      >
        <a className="page-link bold-link">{selectedTrayItem}</a>
        <span className="tray-ico"></span>
      </button>
    </div>
  );
};

export default InPageNavigation;
