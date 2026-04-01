package com.lms.config;

import com.lms.model.Book;
import com.lms.model.UserRole;
import com.lms.repository.BookRepository;
import com.lms.repository.UserRepository;
import com.lms.service.SystemConfigService;
import com.lms.service.UserService;
import com.lms.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final SystemConfigService systemConfigService;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final UserService userService;

    @Value("${app.borrow.default-days:30}")
    private int defaultBorrowDays;

    @Value("${app.borrow.max-count:5}")
    private int maxBorrowCount;

    @Value("${app.borrow.overdue-daily-fee:1.0}")
    private double overdueDailyFee;

    public DataInitializer(SystemConfigService systemConfigService,
                           UserRepository userRepository,
                           BookRepository bookRepository,
                           UserService userService) {
        this.systemConfigService = systemConfigService;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.userService = userService;
    }

    @Override
    public void run(String... args) {
        systemConfigService.initDefaults(defaultBorrowDays, maxBorrowCount, overdueDailyFee);
        if (!userRepository.existsByUsername("admin")) {
            RegisterRequest req = new RegisterRequest();
            req.setUsername("admin");
            req.setRealName("系统管理员");
            req.setPassword("admin123");
            req.setPhone("13800000000");
            req.setIdCard("000000000000000000");
            userService.register(req, UserRole.ADMIN);
        }

        if (bookRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            List<Book> books = List.of(
                buildBook("Java 核心技术（卷 I）", "Cay S. Horstmann", "机械工业出版社", "9787111213826", "编程", 10, now),
                buildBook("深入理解计算机系统", "Randal E. Bryant", "机械工业出版社", "9787111544937", "计算机基础", 8, now),
                buildBook("数据库系统概念", "Abraham Silberschatz", "机械工业出版社", "9787111404361", "数据库", 6, now),
                buildBook("算法导论", "Thomas H. Cormen", "机械工业出版社", "9787111407010", "算法", 7, now),
                buildBook("设计模式：可复用面向对象软件的基础", "Erich Gamma", "机械工业出版社", "9787111075752", "软件工程", 5, now),
                buildBook("Spring 实战", "Craig Walls", "人民邮电出版社", "9787115527929", "编程", 9, now),
                buildBook("MySQL 必知必会", "Ben Forta", "人民邮电出版社", "9787115545381", "数据库", 12, now),
                buildBook("JavaScript 高级程序设计", "Matt Frisbie", "人民邮电出版社", "9787115545382", "前端", 11, now)
            );
            bookRepository.saveAll(books);
        }
    }

    private Book buildBook(String title,
                           String author,
                           String publisher,
                           String isbn,
                           String category,
                           int stock,
                           LocalDateTime now) {
        Book book = new Book();
        book.setTitle(title);
        book.setAuthor(author);
        book.setPublisher(publisher);
        book.setIsbn(isbn);
        book.setCategory(category);
        book.setStock(stock);
        book.setAvailableStock(stock);
        book.setCreatedAt(now);
        book.setUpdatedAt(now);
        return book;
    }
}
