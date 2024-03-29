CREATE TABLE wallpaper
(
    startdate     varchar(8)   not null default ' ',
    fullstartdate varchar(50)  not null default ' ',
    enddate       varchar(8)   not null default ' ',
    url           varchar(150) not null default ' ',
    urlbase       varchar(100) not null default ' ',
    copyright     varchar(150) not null default ' ',
    copyrightlink varchar(150) not null default ' ',
    title         varchar(100) not null default ' ',
    quiz          varchar(150) not null default ' ',
    hsh           varchar(50)  not null default ' ',
    createtime    timestamp,
    updatetime    timestamp,
    primary key (enddate)
);